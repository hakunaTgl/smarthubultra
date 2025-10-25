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

async function createSessionForUser(userKey, email, extra = {}) {
  const sessionId = makeSessionId();
  const session = {
    id: sessionId,
    user: userKey,
    email,
    createdAt: Date.now(),
    method: extra.method || 'email-link',
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

export async function loadAuth() {
  try {
    const signUpForm = document.getElementById('sign-up-form');
    const signInForm = document.getElementById('sign-in-form');
    const forgotLink = document.getElementById('forgot-password');
    const sendBtn = document.getElementById('send-signin-link');

    const actionCodeSettings = {
      url: window.location.origin + window.location.pathname,
      handleCodeInApp: true
    };

    const sendLink = async (email, username) => {
      try {
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        localStorage.setItem('emailForSignIn', email);
        if (username) localStorage.setItem('pendingUsername', username);
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

    if (forgotLink) {
      forgotLink.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = document.getElementById('sign-in-email').value || document.getElementById('sign-up-email').value;
        if (!email) { showToast('Enter your email to resend link'); return; }
        await sendLink(email);
      });
    }

    // Support tickets (unchanged behavior)
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

    speak('Welcome to Smart Hub Ultra! We use secure email links to sign you in.');

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
          if (!userSnap.exists()) {
            await set(dbRef(`users/${key}`), { email: user.email, username: pendingUsername, role: 'user', createdAt: Date.now(), sessions: 0, billing: { balance: 0 }, points: 0, badges: [] });
          }
          await createSessionForUser(key, user.email, { method: 'email-link' });
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

async function createSessionForUser(userKey, email, extra = {}) {
  const sessionId = makeSessionId();
  const session = {
    id: sessionId,
    user: userKey,
    email,
    createdAt: Date.now(),
    method: extra.method || 'email-link',
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

export async function loadAuth() {
  try {
    const signUpForm = document.getElementById('sign-up-form');
    const signInForm = document.getElementById('sign-in-form');
    const forgotLink = document.getElementById('forgot-password');
    const sendBtn = document.getElementById('send-signin-link');

    const actionCodeSettings = {
      url: window.location.origin + window.location.pathname,
      handleCodeInApp: true
    };

    const sendLink = async (email, username) => {
      try {
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        localStorage.setItem('emailForSignIn', email);
        if (username) localStorage.setItem('pendingUsername', username);
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

    if (forgotLink) {
      forgotLink.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = document.getElementById('sign-in-email').value || document.getElementById('sign-up-email').value;
        if (!email) { showToast('Enter your email to resend link'); return; }
        await sendLink(email);
      });
    }

    // Support tickets (unchanged behavior)
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

    speak('Welcome to Smart Hub Ultra! We use secure email links to sign you in.');

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
          if (!userSnap.exists()) {
            await set(dbRef(`users/${key}`), { email: user.email, username: pendingUsername, role: 'user', createdAt: Date.now(), sessions: 0, billing: { balance: 0 }, points: 0, badges: [] });
          }
          await createSessionForUser(key, user.email, { method: 'email-link' });
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
import { showToast, speak, logActivity, closeAllModals } from './utils.js';
import { loadDashboard } from './dashboard.js';
import { startHoloGuide } from './holoGuide.js';
import { dbRef, set, get, update } from './firebaseConfig.js';

function sanitizeKey(email) {
  return (email || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function generateCode(digits = 6) {
  const min = 10 ** (digits - 1);
  return (Math.floor(min + Math.random() * 9 * min)).toString();
}

function makeSessionId() {
  return `s_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
}

async function createSessionForUser(userKey, email, extra = {}) {
  const sessionId = makeSessionId();
  const session = {
    id: sessionId,
    user: userKey,
    email,
    createdAt: Date.now(),
    codeUsed: extra.code || null,
    userAgent: navigator.userAgent || null,
    billing: { amount: 0, currency: 'USD' }
  };
  await set(dbRef(`sessions/${sessionId}`), session);
  // increment user's session count and write a billing stub
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

export async function loadAuth() {
  try {
    // remove dependency on a modal element existing; ensure forms are present
    const signUpForm = document.getElementById('sign-up-form');
    const signInForm = document.getElementById('sign-in-form');
    const forgotLink = document.getElementById('forgot-password');
    const generateBtn = document.getElementById('generate-and-send');

    const createAccountFlow = async (e, sendEmail = false) => {
      if (e) e.preventDefault();
      const email = document.getElementById('sign-up-email').value;
      const username = document.getElementById('sign-up-username').value || email.split('@')[0];
      if (!email) {
        showToast('Please provide an email');
        return;
      }
      const key = sanitizeKey(email);
      const code = generateCode(6);
      const user = {
        email,
        username,
        code,
        role: 'user',
        createdAt: Date.now(),
        sessions: 0,
        billing: { balance: 0 },
        points: 0,
        badges: []
      };
      await set(dbRef(`users/${key}`), user);
      await createSessionForUser(key, email, { code });
      showToast(`Account created. Your recovery code: ${code}`);
      logActivity('User created account (code-based)');
      closeAllModals();
      if (sendEmail) {
        // create a mailto fallback so user can email the code to themselves
        const subject = encodeURIComponent('Your SmartHubUltra recovery code');
        const body = encodeURIComponent(`Hello ${username},\n\nYour SmartHubUltra recovery code is: ${code}\n\nStore this code safely.`);
        window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
      }
      await startHoloGuide();
      await loadDashboard();
    }

    if (generateBtn) {
      generateBtn.addEventListener('click', async () => {
        await createAccountFlow(null, true);
      });
    }

    if (signUpForm) {
      signUpForm.addEventListener('submit', createAccountFlow);
    }

    if (signInForm) {
      signInForm.addEventListener('submit', async e => {
        e.preventDefault();
        const email = document.getElementById('sign-in-email').value;
        const code = document.getElementById('sign-in-code').value;
        if (!email || !code) {
          showToast('Please enter email and code');
          return;
        }
        const key = sanitizeKey(email);
        const userSnap = await get(dbRef(`users/${key}`));
        if (!userSnap.exists()) {
          showToast('Account not found');
          return;
        }
        const user = userSnap.val();
        if (String(user.code) !== String(code).trim()) {
          showToast('Invalid code');
          return;
        }
        await createSessionForUser(key, email, { code });
        showToast('Signed in successfully');
        logActivity('User signed in (code)');
        closeAllModals();
        await loadDashboard();
      });
    }

    if (forgotLink) {
      forgotLink.addEventListener('click', async e => {
        e.preventDefault();
        const email = document.getElementById('sign-in-email').value || document.getElementById('sign-up-email').value;
        if (!email) {
          showToast('Enter your email so we can email your code');
          return;
        }
        const key = sanitizeKey(email);
        const userSnap = await get(dbRef(`users/${key}`));
        if (!userSnap.exists()) {
          showToast('No account for that email');
          return;
        }
        const user = userSnap.val();
        const code = user.code || generateCode(6);
        // update code if missing
        if (!user.code) {
          await update(dbRef(`users/${key}`), { code });
        }
        const subject = encodeURIComponent('Your SmartHubUltra recovery code');
        const body = encodeURIComponent(`Hello ${user.username || ''},\n\nYour SmartHubUltra recovery code is: ${code}\n\nIf you didn't request this, ignore this message.`);
        // mailto fallback for client-side only environments
        window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
        showToast('Opened email composer with your code.');
        logActivity('Requested code email');
      });
    }

    // support form unchanged, but will write tickets to DB
    const supportForm = document.getElementById('support-form');
    if (supportForm) {
      supportForm.addEventListener('submit', async e => {
        e.preventDefault();
        const email = document.getElementById('support-email').value;
        const message = document.getElementById('support-message').value;
        const ticket = {
          id: Date.now().toString(),
          email,
          message,
          timestamp: Date.now()
        };
        await set(dbRef('support/' + ticket.id), ticket);
        showToast('Support ticket submitted');
        logActivity('Submitted support ticket');
        e.target.reset();
      });
    }

    speak('Welcome to Smart Hub Ultra! Use your email and recovery code to sign in.');
  } catch (error) {
    showToast(`Auth setup failed: ${error.message}`);
    console.error('Auth Error:', error);
  }
}
