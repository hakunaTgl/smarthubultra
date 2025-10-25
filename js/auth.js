import { showToast, speak, logActivity, closeAllModals } from './utils.js';
import { loadDashboard } from './dashboard.js';
import { startHoloGuide } from './holoGuide.js';
import { dbRef, set, get, update, auth } from './firebaseConfig.js';
import { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';

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
      await update(dbRef(`users/${userKey}`), { sessions });
      await set(dbRef(`billing/${userKey}/${sessionId}`), { sessionId, amount: 0, timestamp: Date.now() });
    }
  } catch (e) {
    console.warn('Failed to update billing/session count', e);
  }
  localStorage.setItem('currentUser', userKey);
  localStorage.setItem('currentSession', sessionId);
  return session;
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

// Instance code sign-in function
async function signInWithInstanceCode(email, instanceCode) {
  try {
    const key = sanitizeKey(email);
    
    // Check if instance code exists
    const codeSnap = await get(dbRef(`instanceCodes/${instanceCode}`));
    if (!codeSnap.exists()) {
      showToast('Invalid instance code');
      return;
    }
    
    const codeData = codeSnap.val();
    if (codeData.used || (codeData.expiresAt && codeData.expiresAt < Date.now())) {
      showToast('Instance code has expired or already been used');
      return;
    }
    
    // Create or get user
    const userSnap = await get(dbRef(`users/${key}`));
    if (!userSnap.exists()) {
      const username = email.split('@')[0];
      await ensureUserRecord(email, { username });
    }
    
    // Mark code as used
    await update(dbRef(`instanceCodes/${instanceCode}`), { used: true, usedBy: email, usedAt: Date.now() });
    
    // Create session
    await createSessionForUser(key, email, { method: 'instance-code', code: instanceCode });
    await update(dbRef(`users/${key}`), {
      lastSignInMethod: 'instance-code',
      lastInstanceCode: {
        codeSuffix: instanceCode.slice(-4),
        usedAt: Date.now(),
        status: 'consumed',
        issuer: codeData.createdBy || 'system'
      }
    });
    
    showToast('Successfully joined with instance code!');
    logActivity('Signed in via instance code');
    closeAllModals();
    await startHoloGuide();
    await loadDashboard();
  } catch (err) {
    console.error('Instance code sign-in error:', err);
    throw err;
  }
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

export async function loadAuth() {
  try {
    const signUpForm = document.getElementById('sign-up-form');
    const signInForm = document.getElementById('sign-in-form');
    const forgotLink = document.getElementById('forgot-password');
    const sendBtn = document.getElementById('send-signin-link');
    const instanceCodeForm = document.getElementById('instance-code-form');

    const actionCodeSettings = {
      url: window.location.origin + window.location.pathname,
      handleCodeInApp: true
    };

    const sendLink = async (email, username) => {
      try {
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        localStorage.setItem('emailForSignIn', email);
        if (username) localStorage.setItem('pendingUsername', username);
        const overrides = {
          lastEmailLink: {
            sentAt: Date.now(),
            status: 'sent',
            method: 'email-link'
          },
          lastSignInMethod: 'email-link'
        };
        if (username) overrides.username = username;
        const sanitizedKey = await ensureUserRecord(email, overrides);
        if (sanitizedKey) {
          localStorage.setItem('currentUser', sanitizedKey);
        }
        showToast('Sign-in link sent. Check your email.');
        logActivity('Sent sign-in link');
      } catch (err) {
        console.error('sendSignInLinkToEmail', err);
        showToast('Failed to send sign-in link');
      }
    };

    if (sendBtn) sendBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = document.getElementById('sign-up-email').value;
      const username = document.getElementById('sign-up-username').value || '';
      if (!email) { showToast('Please provide an email'); return; }
      await sendLink(email, username);
    });

    if (signUpForm) {
      signUpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('sign-up-email').value;
        const username = document.getElementById('sign-up-username').value || '';
        if (!email) { showToast('Please provide an email'); return; }
        await sendLink(email, username);
      });
    }

    if (signInForm) {
      signInForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('sign-in-email').value;
        if (!email) { showToast('Enter your email to receive a sign-in link'); return; }
        await sendLink(email);
      });
    }

    // Instance code form handler
    if (instanceCodeForm) {
      instanceCodeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const instanceCode = document.getElementById('instance-code').value;
        const email = document.getElementById('code-email').value;
        if (!instanceCode || !email) {
          showToast('Please enter both email and instance code');
          return;
        }
        try {
          await signInWithInstanceCode(email, instanceCode);
        } catch (err) {
          showToast('Failed to join with instance code');
        }
      });
    }

    if (forgotLink) {
      forgotLink.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = document.getElementById('sign-in-email').value || document.getElementById('sign-up-email').value;
        if (!email) { showToast('Enter your email to resend link'); return; }
        await sendLink(email);
      });
    }

    // Support tickets
    const supportForm = document.getElementById('support-form');
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