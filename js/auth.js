 import { showToast, speak, logActivity, closeAllModals } from './utils.js';
import { loadDashboard } from './dashboard.js';
import { startHoloGuide } from './holoGuide.js';
import { dbRef, set, get, update, auth, functions, httpsCallable, FUNCTIONS_BASE_URL } from './firebaseConfig.js';
import { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';

const MAGIC_LINK_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes
const ADMIN_FASTPASS_CODE = 'SMARTHUB-EXEC-2025';
const CORE_ACCOUNTS = [
  {
    email: 'boss@smarthubultra.dev',
    username: 'Boss Operator',
    role: 'admin',
    accessTier: 'executive',
    badges: ['executive', 'visionary']
  },
  {
    email: 'admin@smarthubultra.dev',
    username: 'Admin Control',
    role: 'admin',
    accessTier: 'control',
    badges: ['admin', 'guardian']
  }
];
const GUEST_NAME_POOL = ['Nova Guest', 'Pulse Guest', 'Velocity Guest', 'Orbit Guest', 'Flux Guest'];
const grantAdminRoleCallable = httpsCallable(functions, 'grantAdminRole');
const INVITE_ENDPOINT = `${FUNCTIONS_BASE_URL}/sendInviteEmail`;
const PROJECT_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const projectCodeElements = {
  panel: null,
  meta: null,
  input: null
};

function sanitizeKey(email) {
  return (email || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function makeSessionId() {
  return `s_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
}

function generateCode(digits = 6) {
  const min = 10 ** (digits - 1);
  return (Math.floor(min + Math.random() * 9 * min)).toString();
}

function generateProjectCode(length = 6) {
  let code = '';
  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * PROJECT_CODE_ALPHABET.length);
    code += PROJECT_CODE_ALPHABET[index];
  }
  return code;
}

function normalizeProjectCode(raw = '') {
  return (raw || '').toString().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
}

function pickRandom(list = []) {
  if (!list.length) return '';
  return list[Math.floor(Math.random() * list.length)];
}

function describeExpiry(expiresAt) {
  const remainingMs = Math.max(0, (expiresAt || Date.now()) - Date.now());
  const minutes = Math.max(1, Math.round(remainingMs / 60000));
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

async function createSessionForUser(userKey, email, extra = {}) {
  const sessionId = makeSessionId();
  const session = {
    id: sessionId,
    user: userKey,
    email,
    createdAt: Date.now(),
    method: extra.method || 'email-link',
    instanceCode: extra.code || null,
    userAgent: navigator.userAgent || null,
    billing: { amount: 0, currency: 'USD' }
  };
  await set(dbRef(`sessions/${sessionId}`), session);
  try {
    const userSnap = await get(dbRef(`users/${userKey}`));
    if (userSnap.exists()) {
      const user = userSnap.val();
      const sessions = (user.sessions || 0) + 1;
      await update(dbRef(`users/${userKey}`), { sessions, lastSessionAt: Date.now() });
      await set(dbRef(`billing/${userKey}/${sessionId}`), { sessionId, amount: 0, timestamp: Date.now() });
    }
  } catch (e) {
    console.warn('Failed to update billing/session count', e);
  }
  localStorage.setItem('currentUser', userKey);
  localStorage.setItem('currentSession', sessionId);
  return session;
}

async function ensureCoreAccounts() {
  await Promise.all(CORE_ACCOUNTS.map(async (account) => {
    const key = sanitizeKey(account.email);
    const ref = dbRef(`users/${key}`);
    try {
      const snap = await get(ref);
      if (!snap.exists()) {
        const baseUser = {
          email: account.email,
          username: account.username,
          role: account.role,
          createdAt: Date.now(),
          sessions: 0,
          billing: { balance: 0 },
          points: 0,
          badges: account.badges || [],
          accessTier: account.accessTier || 'executive'
        };
        await set(ref, baseUser);
      } else {
        const data = snap.val() || {};
        const updates = {};
        if (data.role !== account.role) updates.role = account.role;
        if (!data.username && account.username) updates.username = account.username;
        if (account.accessTier && data.accessTier !== account.accessTier) updates.accessTier = account.accessTier;
        if (Array.isArray(account.badges)) {
          const merged = Array.from(new Set([...(data.badges || []), ...account.badges]));
          updates.badges = merged;
        }
        if (Object.keys(updates).length) {
          await update(ref, updates);
        }
      }
    } catch (err) {
      console.warn('ensureCoreAccounts failed for', account.email, err);
    }
  }));
}

async function generateFallbackMagicLink(email, metadata = {}) {
  const token = `ml_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
  const createdAt = Date.now();
  const expiresAt = createdAt + MAGIC_LINK_EXPIRY_MS;
  const issuer = metadata.issuer || localStorage.getItem('currentUser') || 'system';
  const record = {
    email,
    createdAt,
    expiresAt,
    used: false,
    metadata: {
      ...metadata,
      issuer,
      method: metadata.method || 'magic-link'
    }
  };
  try {
    await set(dbRef(`magicLinks/${token}`), record);
  } catch (err) {
    console.warn('Failed to persist fallback magic link', err);
    throw err;
  }
  const url = buildMagicLinkUrl(token);
  console.info('Magic link generated for', email, url);
  return { token, url, expiresAt };
}

function buildMagicLinkUrl(token) {
  const url = new URL(window.location.href);
  url.searchParams.set('magicLink', token);
  return url.toString();
}

function stripQueryParam(name) {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(name)) return;
  url.searchParams.delete(name);
  const newUrl = url.search ? `${url.pathname}?${url.searchParams.toString()}` : url.pathname;
  window.history.replaceState({}, document.title, newUrl);
}

async function copyToClipboardSafe(value) {
  if (!value) return false;
  try {
    await navigator.clipboard.writeText(value);
    showToast('Link copied to clipboard');
    return true;
  } catch (err) {
    console.warn('Clipboard copy failed', err);
    try {
      const helper = document.createElement('textarea');
      helper.value = value;
      helper.style.position = 'fixed';
      helper.style.opacity = '0';
      document.body.appendChild(helper);
      helper.select();
      document.execCommand('copy');
      document.body.removeChild(helper);
      showToast('Link copied to clipboard');
      return true;
    } catch (fallbackErr) {
      console.warn('Fallback copy failed', fallbackErr);
      showToast('Unable to copy automatically — copy the link manually.');
      return false;
    }
  }
}

function openMailClient(email, subject, body) {
  try {
    const mailto = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    // open in new window/tab to avoid navigation replacement
    window.open(mailto, '_blank');
  } catch (err) {
    console.warn('Failed to open mail client', err);
  }
}

async function ensureUserRecord(email, overrides = {}) {
  const key = sanitizeKey(email);
  const ref = dbRef(`users/${key}`);
  try {
    const snap = await get(ref);
    if (!snap.exists()) {
      const username = email.split('@')[0];
      const baseUser = {
        email,
        username,
        role: 'user',
        createdAt: Date.now(),
        sessions: 0,
        billing: { balance: 0 },
        points: 0,
        badges: []
      };
      await set(ref, { ...baseUser, ...overrides });
    } else if (overrides && Object.keys(overrides).length) {
      await update(ref, overrides);
    }
  } catch (error) {
    console.warn('ensureUserRecord failed', error);
  }
  return key;
}

async function completeFallbackMagicLink(token) {
  const ref = dbRef(`magicLinks/${token}`);
  try {
    const snap = await get(ref);
    if (!snap.exists()) {
      showToast('Magic link invalid or already cleared.');
      return false;
    }
    const entry = snap.val();
    if (entry.used) {
      showToast('Magic link already used. Request a fresh link.');
      return false;
    }
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      showToast('Magic link expired. Request a new one.');
      return false;
    }
    const overrides = entry.metadata?.overrides || {};
    const key = await ensureUserRecord(entry.email, overrides);
    await createSessionForUser(key, entry.email, { method: entry.metadata?.method || 'magic-link' });
    await update(dbRef(`users/${key}`), {
      lastSignInMethod: entry.metadata?.method || 'magic-link',
      lastEmailLink: {
        sentAt: entry.createdAt,
        usedAt: Date.now(),
        status: 'used-fallback',
        issuer: entry.metadata?.issuer || 'system'
      }
    });
    await update(ref, { used: true, usedAt: Date.now() });
    showToast('Signed in via instant magic link');
    logActivity('Signed in via instant magic link', { tokenSuffix: token.slice(-6) });
    closeAllModals();
    await startHoloGuide();
    await loadDashboard();
    return true;
  } catch (err) {
    console.error('completeFallbackMagicLink failed', err);
    showToast('Magic link sign-in failed');
    return false;
  } finally {
    stripQueryParam('magicLink');
  }
}

async function processMagicLinkFromUrl() {
  const url = new URL(window.location.href);
  const token = url.searchParams.get('magicLink');
  if (!token) return false;
  return completeFallbackMagicLink(token);
}

async function allocateProjectCode(attempts = 5) {
  for (let i = 0; i < attempts; i += 1) {
    const candidate = generateProjectCode();
    const existing = await get(dbRef(`projectSessions/${candidate}`));
    if (!existing.exists()) {
      return candidate;
    }
  }
  throw new Error('Unable to reserve project code');
}

async function startGuestSession() {
  try {
    const handle = pickRandom(GUEST_NAME_POOL) || 'Guest';
    const email = `guest+${Date.now()}@guest.smarthub`; 
    const key = await ensureUserRecord(email, {
      username: handle,
      role: 'guest',
      guest: { createdAt: Date.now(), label: handle }
    });
    await createSessionForUser(key, email, { method: 'guest' });
    await update(dbRef(`users/${key}`), {
      lastSignInMethod: 'guest',
      guest: { createdAt: Date.now(), label: handle }
    });
    localStorage.removeItem('emailForSignIn');
    localStorage.removeItem('pendingUsername');
    showToast('Guest session activated');
    logActivity('guest-session:start', { user: key });
    closeAllModals();
    await startHoloGuide();
    await loadDashboard();
  } catch (err) {
    console.error('Guest session error', err);
    showToast('Unable to start guest session');
  }
}

async function startProjectSession(preferredName = '') {
  try {
    const code = await allocateProjectCode();
    const now = Date.now();
    const label = preferredName?.trim() || `Project-${code}`;
    const email = `project+${code.toLowerCase()}@projects.smarthub`;
    const overrides = {
      username: label,
      role: 'creator',
      accessTier: 'builder',
      project: {
        code,
        createdAt: now,
        label
      }
    };
    const key = await ensureUserRecord(email, overrides);
    await update(dbRef(`users/${key}`), {
      ...overrides,
      lastSignInMethod: 'project-code'
    });
    await set(dbRef(`projectSessions/${code}`), {
      code,
      user: key,
      createdAt: now,
      lastAccessed: now
    });
    await createSessionForUser(key, email, { method: 'project-code', code });
    await update(dbRef(`users/${key}`), {
      project: {
        code,
        createdAt: now,
        label,
        lastAccessed: now
      }
    });
    localStorage.setItem('projectCode', code);
    const resumeInput = document.getElementById('project-code-input');
    if (resumeInput) {
      resumeInput.value = code;
    }
    showProjectCodePanel(code, `Project session active • code ${code}`);
    showToast(`Project session ready. Code: ${code}`);
    logActivity('project-session:start', { code });
    closeAllModals();
    await startHoloGuide();
    await loadDashboard();
    return code;
  } catch (err) {
    console.error('Project session start failed', err);
    showToast('Unable to start project session');
    return null;
  }
}

async function resumeProjectSession(codeRaw) {
  const code = normalizeProjectCode(codeRaw);
  if (!code) {
    showToast('Enter a valid project code');
    return false;
  }
  try {
    const snap = await get(dbRef(`projectSessions/${code}`));
    if (!snap.exists()) {
      showToast('Project code not found');
      return false;
    }
    const entry = snap.val() || {};
    const userKey = entry.user;
    if (!userKey) {
      showToast('Project session is missing owner data');
      return false;
    }
    const userSnap = await get(dbRef(`users/${userKey}`));
    if (!userSnap.exists()) {
      showToast('Project user profile missing');
      return false;
    }
    const user = userSnap.val() || {};
    const email = user.email || `project+${code.toLowerCase()}@projects.smarthub`;
    await createSessionForUser(userKey, email, { method: 'project-code', code });
    const now = Date.now();
    await update(dbRef(`users/${userKey}`), {
      lastSignInMethod: 'project-code',
      project: {
        ...(user.project || {}),
        code,
        lastAccessed: now
      }
    });
    await update(dbRef(`projectSessions/${code}`), {
      lastAccessed: now,
      lastUserAgent: navigator.userAgent || null
    });
    localStorage.setItem('projectCode', code);
    const resumeInput = document.getElementById('project-code-input');
    if (resumeInput) {
      resumeInput.value = code;
    }
    showProjectCodePanel(code, `Project session active • code ${code}`);
    showToast('Project session restored');
    logActivity('project-session:resume', { code });
    closeAllModals();
    await startHoloGuide();
    await loadDashboard();
    return true;
  } catch (err) {
    console.error('Project session resume failed', err);
    showToast('Unable to resume project session');
    return false;
  }
}

async function grantAdminClaims(targetEmail, overrideCode) {
  if (!auth.currentUser) {
    showToast('Complete a Firebase sign-in before requesting admin access');
    return false;
  }
  const normalized = (targetEmail || '').toLowerCase();
  const currentEmail = (auth.currentUser.email || '').toLowerCase();
  if (normalized && currentEmail !== normalized) {
    showToast('Sign in with the admin email first, then re-run the override');
    return false;
  }
  try {
    const response = await grantAdminRoleCallable({ targetEmail: normalized, overrideCode });
    await auth.currentUser.getIdToken(true);
    logActivity('admin-claims:granted', { email: normalized });
    return response?.data || response;
  } catch (err) {
    console.error('grantAdminClaims failed', err);
    const code = err?.code || '';
    if (code.includes('permission-denied')) {
      showToast('Admin verification rejected');
    } else if (code.includes('unauthenticated')) {
      showToast('Sign in again before requesting admin access');
    } else {
      showToast('Admin elevation failed');
    }
    return false;
  }
}

async function fastLoginAsAdmin() {
  const code = window.prompt('Enter executive override code');
  if (!code) {
    showToast('Override cancelled');
    return;
  }
  const trimmed = code.trim();
  if (trimmed !== ADMIN_FASTPASS_CODE) {
    showToast('Invalid executive override code');
    return;
  }
  const email = window.prompt('Admin email', CORE_ACCOUNTS[0]?.email || 'boss@smarthubultra.dev');
  if (!email) {
    showToast('Admin email required');
    return;
  }
  const target = CORE_ACCOUNTS.find(account => account.email.toLowerCase() === email.toLowerCase());
  const profile = target || {
    email,
    username: email.split('@')[0],
    role: 'admin',
    accessTier: 'executive',
    badges: ['admin']
  };
  const currentEmail = (auth.currentUser?.email || '').toLowerCase();
  if (!currentEmail) {
    showToast('Sign in with a magic link before using the override');
    return;
  }
  if (currentEmail !== profile.email.toLowerCase()) {
    showToast('Admin override requires signing in with that admin address first');
    return;
  }
  try {
    const claims = await grantAdminClaims(profile.email, trimmed);
    if (!claims) {
      return;
    }
    const key = await ensureUserRecord(profile.email, {
      username: profile.username,
      role: profile.role,
      accessTier: profile.accessTier,
      badges: profile.badges
    });
    await update(dbRef(`users/${key}`), {
      role: profile.role,
      accessTier: profile.accessTier,
      badges: profile.badges
    });
    localStorage.removeItem('emailForSignIn');
    localStorage.removeItem('pendingUsername');
    await createSessionForUser(key, profile.email, { method: 'admin-fastpass' });
    showToast('Executive session restored');
    logActivity('admin-fastpass', { account: profile.email });
    closeAllModals();
    await startHoloGuide();
    await loadDashboard();
  } catch (err) {
    console.error('Admin fast login failed', err);
    showToast('Unable to start admin session');
  }
}

function updateLinkPanel(panel, metaEl, inputEl, email, url, expiresAt, contextLabel) {
  if (!panel || !metaEl || !inputEl) return;
  panel.classList.remove('hidden');
  metaEl.textContent = `${contextLabel} for ${email} • expires in ${describeExpiry(expiresAt)}`;
  inputEl.value = url;
}

function hideLinkPanel(panel, metaEl, inputEl) {
  if (!panel || !metaEl || !inputEl) return;
  panel.classList.add('hidden');
  metaEl.textContent = '';
  inputEl.value = '';
}

function showProjectCodePanel(code, message) {
  const { panel, meta, input } = projectCodeElements;
  if (!panel || !meta || !input) return;
  panel.classList.remove('hidden');
  meta.textContent = message || 'Save this code to resume later';
  input.value = code;
}

function hideProjectCodePanel() {
  const { panel, meta, input } = projectCodeElements;
  if (!panel || !meta || !input) return;
  panel.classList.add('hidden');
  meta.textContent = '';
  input.value = '';
}

// Function to generate instance codes (for admin use)
export async function generateInstanceCode(expirationHours = 24) {
  const code = generateCode(8);
  const expiresAt = Date.now() + (expirationHours * 60 * 60 * 1000);
  
  await set(dbRef(`instanceCodes/${code}`), {
    createdAt: Date.now(),
    expiresAt,
    used: false,
    createdBy: localStorage.getItem('currentUser') || 'system'
  });
  
  return code;
}

async function sendTransactionalInvite(email, role) {
  if (!auth.currentUser) {
    throw new Error('Sign in before sending invites');
  }
  const idToken = await auth.currentUser.getIdToken();
  const response = await fetch(INVITE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`
    },
    body: JSON.stringify({
      email,
      role,
      baseUrl: window.location.origin + window.location.pathname
    })
  });
  const raw = await response.text();
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn('Invite response parsing failed', err);
  }
  if (!response.ok) {
    const message = data?.error || response.statusText || 'Invite send failed';
    throw new Error(message);
  }
  return data;
}

export async function loadAuth() {
  try {
    const signUpForm = document.getElementById('sign-up-form');
    const signUpEmailInput = document.getElementById('sign-up-email');
    const signUpUsernameInput = document.getElementById('sign-up-username');
    const signInForm = document.getElementById('sign-in-form');
    const signInEmailInput = document.getElementById('sign-in-email');
    const forgotLink = document.getElementById('forgot-password');
    const sendBtn = document.getElementById('send-signin-link');
  const projectSessionBtn = document.getElementById('project-session-btn');
  const projectCodePanelEl = document.getElementById('project-code-panel');
  const projectCodeMeta = document.getElementById('project-code-meta');
  const projectCodeValue = document.getElementById('project-code-value');
  const projectCodeCopyBtn = document.getElementById('project-code-copy');
  const projectCodeForm = document.getElementById('project-code-form');
  const projectCodeInput = document.getElementById('project-code-input');
    const supportForm = document.getElementById('support-form');

    const fallbackPanel = document.getElementById('magic-link-fallback');
    const fallbackMeta = document.getElementById('magic-link-meta');
    const fallbackLinkInput = document.getElementById('magic-link-url');
    const fallbackCopyBtn = document.getElementById('magic-link-copy');

  const guestBtn = document.getElementById('guest-login-btn');
  const adminBtn = document.getElementById('admin-fast-login-btn');

  projectCodeElements.panel = projectCodePanelEl;
  projectCodeElements.meta = projectCodeMeta;
  projectCodeElements.input = projectCodeValue;

    const savedProjectCode = normalizeProjectCode(localStorage.getItem('projectCode') || '');
    if (savedProjectCode) {
      showProjectCodePanel(savedProjectCode, `Saved project code • ${savedProjectCode}`);
    }

    const inviteForm = document.getElementById('invite-collab-form');
    const inviteEmailInput = document.getElementById('invite-email');
    const inviteRoleSelect = document.getElementById('invite-role');
    const invitePanel = document.getElementById('invite-link-output');
    const inviteMeta = document.getElementById('invite-link-meta');
    const inviteLinkInput = document.getElementById('invite-link-url');
    const inviteCopyBtn = document.getElementById('invite-link-copy');

    await ensureCoreAccounts();
    await processMagicLinkFromUrl();

    const actionCodeSettings = {
      url: window.location.origin + window.location.pathname,
      handleCodeInApp: true
    };

    const sendLink = async (emailRaw, usernameRaw = '', overrideOptions = {}) => {
      const email = (emailRaw || '').trim();
      const username = (usernameRaw || '').trim();
      if (!email) {
        showToast('Provide a valid email');
        return null;
      }

      const overrides = {
        lastEmailLink: {
          sentAt: Date.now(),
          status: 'sent',
          method: 'email-link'
        },
        lastSignInMethod: 'email-link',
        ...overrideOptions
      };
      if (username) overrides.username = username;
      if (!overrides.role) overrides.role = 'user';

      const sanitizedKey = await ensureUserRecord(email, overrides);
      if (sanitizedKey) {
        localStorage.setItem('currentUser', sanitizedKey);
      }
      localStorage.setItem('emailForSignIn', email);
      if (username) localStorage.setItem('pendingUsername', username);

      // Always generate a fallback magic link first so there's a usable URL even if email sending fails
      let fallback = null;
      try {
        fallback = await generateFallbackMagicLink(email, { overrides, method: 'email-link' });
        updateLinkPanel(fallbackPanel, fallbackMeta, fallbackLinkInput, email, fallback.url, fallback.expiresAt, 'Magic link');
        logActivity('Generated fallback magic link', { email });
      } catch (fallbackErr) {
        console.error('Fallback magic link generation failed', fallbackErr);
      }

      // Attempt to send the Firebase email link; if it fails, open the user's mail client prefilled with the fallback URL
      let emailSent = false;
      try {
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        emailSent = true;
        showToast('Sign-in email dispatched. Check your inbox.');
        logActivity('Sent sign-in link', { channel: 'email', email });
      } catch (err) {
        console.error('sendSignInLinkToEmail failed', err);
        showToast('Email delivery failed — providing instant link and a prefilled email draft.');
        if (fallback && email) {
          // Open mail client with prefilled subject/body so user can forward/copy the link
          openMailClient(email, 'SmartHubUltra sign-in link', `Use this link to sign in: ${fallback.url}\n\nLink expires in ${describeExpiry(fallback.expiresAt)}`);
        }
      }

      return fallback;
    };

    if (sendBtn) sendBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = signUpEmailInput?.value || '';
      const username = signUpUsernameInput?.value || '';
      if (!email) { showToast('Please provide an email'); return; }
      await sendLink(email, username);
    });

    if (signUpForm) {
      signUpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = signUpEmailInput?.value || '';
        const username = signUpUsernameInput?.value || '';
        if (!email) { showToast('Please provide an email'); return; }
        await sendLink(email, username);
      });
    }

    if (signInForm) {
      signInForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = signInEmailInput?.value || '';
        if (!email) { showToast('Enter your email to receive a sign-in link'); return; }
        await sendLink(email);
      });
    }

    if (projectCodeInput) {
      projectCodeInput.addEventListener('input', () => {
        const caret = projectCodeInput.selectionStart;
        projectCodeInput.value = normalizeProjectCode(projectCodeInput.value);
        projectCodeInput.selectionStart = projectCodeInput.selectionEnd = caret;
      });
    }

    if (projectSessionBtn) {
      projectSessionBtn.addEventListener('click', async () => {
        const name = window.prompt('Name your project (optional)');
        await startProjectSession(name || '');
      });
    }

    if (projectCodeForm) {
      projectCodeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const codeValue = projectCodeInput?.value;
        if (!codeValue) {
          showToast('Enter a project code');
          return;
        }
        const success = await resumeProjectSession(codeValue);
        if (!success) {
          logActivity('project-session:resume-failed', { code: codeValue });
        }
      });
    }

    if (forgotLink) {
      forgotLink.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = (signInEmailInput?.value || signUpEmailInput?.value || '').trim();
        if (!email) { showToast('Enter your email to resend link'); return; }
        await sendLink(email);
      });
    }

    if (fallbackCopyBtn) {
      fallbackCopyBtn.addEventListener('click', async () => {
        const value = fallbackLinkInput?.value;
        if (!value) {
          showToast('Generate a link first');
          return;
        }
        await copyToClipboardSafe(value);
      });
    }

    if (projectCodeCopyBtn) {
      projectCodeCopyBtn.addEventListener('click', async () => {
        const value = projectCodeValue?.value;
        if (!value) {
          showToast('Start a project session first');
          return;
        }
        await copyToClipboardSafe(value);
      });
    }

    if (guestBtn) {
      guestBtn.addEventListener('click', () => {
        startGuestSession();
      });
    }

    if (adminBtn) {
      adminBtn.addEventListener('click', () => {
        fastLoginAsAdmin();
      });
    }

    if (inviteForm) {
      inviteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = inviteEmailInput?.value || '';
        const role = inviteRoleSelect?.value || 'user';
        if (!email) {
          showToast('Enter an email to invite');
          return;
        }
        try {
          const overrides = { role };
          if (role === 'guest') {
            overrides.username = `Guest-${email.split('@')[0]}`;
          }
          await ensureUserRecord(email, overrides);
          let linkDetails = null;
          try {
            const result = await sendTransactionalInvite(email, role);
            linkDetails = {
              url: result?.inviteLink,
              expiresAt: result?.expiresAt,
              delivered: !!result?.delivered,
              source: 'cloud-function'
            };
            showToast(result?.delivered ? 'Invite email dispatched' : 'Invite link ready to share');
            logActivity('Generated invite link', { email, role, delivered: !!result?.delivered });
          } catch (inviteErr) {
            console.error('Transactional invite failed', inviteErr);
            const fallback = await generateFallbackMagicLink(email, { overrides, method: 'invite-link' });
            linkDetails = {
              url: fallback?.url,
              expiresAt: fallback?.expiresAt,
              delivered: false,
              source: 'fallback'
            };
            showToast('Invite email failed — manual link ready below');
            logActivity('Generated invite link', { email, role, delivered: false, fallback: true });
          }
          if (!linkDetails?.url) {
            const fallback = await generateFallbackMagicLink(email, { overrides, method: 'invite-link' });
            linkDetails = {
              url: fallback?.url,
              expiresAt: fallback?.expiresAt,
              delivered: false,
              source: 'fallback-empty'
            };
          }
          if (linkDetails?.url) {
            updateLinkPanel(invitePanel, inviteMeta, inviteLinkInput, email, linkDetails.url, linkDetails.expiresAt, 'Invite link');
          }
        } catch (err) {
          console.error('Invite generation failed', err);
          showToast('Failed to generate invite link');
        }
      });
    }

    if (inviteCopyBtn) {
      inviteCopyBtn.addEventListener('click', async () => {
        const value = inviteLinkInput?.value;
        if (!value) {
          showToast('Create an invite first');
          return;
        }
        await copyToClipboardSafe(value);
      });
    }

    // Support tickets
    if (supportForm) {
      supportForm.addEventListener('submit', async e => {
        e.preventDefault();
        const email = document.getElementById('support-email').value;
        const message = document.getElementById('support-message').value;
        const ticket = { id: Date.now().toString(), email, message, timestamp: Date.now() };
        await set(dbRef('support/' + ticket.id), ticket);
        showToast('Support ticket submitted');
        logActivity('Submitted support ticket');
        e.target.reset();
      });
    }

    speak('Welcome to Smart Hub Ultra! Use email links or instance codes to sign in.');

    // complete sign-in when returning from email link
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Please confirm your email for sign-in');
      }
      if (email) {
        try {
          const result = await signInWithEmailLink(auth, email, window.location.href);
          const user = result.user;
          const key = sanitizeKey(user.email);
          const pendingUsername = localStorage.getItem('pendingUsername') || user.displayName || (user.email ? user.email.split('@')[0] : '');
          const userSnap = await get(dbRef(`users/${key}`));
          let existingProfile = null;
          if (!userSnap.exists()) {
            await ensureUserRecord(user.email, { username: pendingUsername });
          } else {
            existingProfile = userSnap.val();
            if (pendingUsername && existingProfile.username !== pendingUsername) {
              await update(dbRef(`users/${key}`), { username: pendingUsername });
            }
          }
          await createSessionForUser(key, user.email, { method: 'email-link' });
          const previousLinkMeta = existingProfile?.lastEmailLink || {};
          await update(dbRef(`users/${key}`), {
            lastSignInMethod: 'email-link',
            lastEmailLink: {
              ...previousLinkMeta,
              usedAt: Date.now(),
              status: 'used'
            }
          });
          hideLinkPanel(fallbackPanel, fallbackMeta, fallbackLinkInput);
          showToast('Signed in with email link');
          logActivity('Signed in via email link');
          localStorage.removeItem('pendingUsername');
          localStorage.removeItem('emailForSignIn');
          closeAllModals();
          await startHoloGuide();
          await loadDashboard();
        } catch (err) {
          console.error('signInWithEmailLink', err);
          showToast('Failed to complete sign-in');
        }
      }
    }

  } catch (error) {
    showToast(`Auth setup failed: ${error.message}`);
    console.error('Auth Error:', error);
  }
}