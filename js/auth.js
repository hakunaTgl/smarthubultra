import { showToast, speak } from './utils.js';
import { IDB } from './utils.js';
import { showWelcome } from './dashboard.js';

export function initializeAuth(onSuccess) {
  document.getElementById('sign-up-btn').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const sixDigit = document.getElementById('six-digit').value;
    const fourDigit = document.getElementById('four-digit').value;
    await signUp(email, username, password, sixDigit, fourDigit, onSuccess);
  });

  document.getElementById('sign-in-btn').addEventListener('click', async () => {
    const loginId = document.getElementById('email').value || document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const sixDigit = document.getElementById('six-digit').value;
    const fourDigit = document.getElementById('four-digit').value;
    await signIn(loginId, password, sixDigit, fourDigit, onSuccess);
  });

  document.getElementById('forgot-password').addEventListener('click', () => {
    closeAllModals();
    document.getElementById('recovery-modal').classList.remove('hidden');
  });

  document.getElementById('recover-btn').addEventListener('click', recoverPassword);
  document.getElementById('contact-support').addEventListener('click', () => {
    closeAllModals();
    document.getElementById('support-modal').classList.remove('hidden');
  });
  document.getElementById('submit-support').addEventListener('click', submitSupportTicket);
}

async function signUp(email, username, password, sixDigit, fourDigit, onSuccess) {
  try {
    document.getElementById('login-spinner').classList.remove('hidden');
    if (!email && !username) throw new Error('Invalid Credentials: Email or username required');
    if (password.length < 8) throw new Error('Invalid Password: Must be at least 8 characters');
    if (!/^\d{6}$/.test(sixDigit)) throw new Error('Invalid Code: 6-digit code must be exactly 6 digits');
    if (!/^\d{4}$/.test(fourDigit)) throw new Error('Invalid Code: 4-digit code must be exactly 4 digits');
    const userByEmail = email ? await IDB.get('users', email) : null;
    const userByUsername = username ? await IDB.get('users', username) : null;
    if (userByEmail || userByUsername) throw new Error('Account Exists: Email or username already registered');
    const user = {
      email: email || username,
      username,
      password,
      sixDigit,
      fourDigit,
      createdAt: Date.now(),
      points: 0,
      level: 1,
      xp: 0,
      role: 'user',
      badges: [],
      passwordChanges: [],
      modalLayouts: {},
      collabUsers: []
    };
    await IDB.batchSet('users', [user]);
    localStorage.setItem('currentUser', email || username);
    firebase.database().ref('users/' + (email || username).replace(/[^a-zA-Z0-9]/g, '')).set(user);
    showToast('Signed up successfully!');
    document.getElementById('login-modal').classList.add('hidden');
    showWelcome();
    onSuccess();
  } catch (error) {
    document.getElementById('auth-error').textContent = error.message;
    document.getElementById('auth-error').classList.remove('hidden');
    showToast(`Sign-up failed: ${error.message}`);
  } finally {
    document.getElementById('login-spinner').classList.add('hidden');
  }
}

async function signIn(loginId, password, sixDigit, fourDigit, onSuccess) {
  try {
    document.getElementById('login-spinner').classList.remove('hidden');
    if (!loginId || !password) throw new Error('Invalid Credentials: Login ID and password required');
    if (!/^\d{6}$/.test(sixDigit)) throw new Error('Invalid Code: 6-digit code must be exactly 6 digits');
    if (!/^\d{4}$/.test(fourDigit)) throw new Error('Invalid Code: 4-digit code must be exactly 4 digits');
    let user = await IDB.get('users', loginId);
    if (!user) {
      const users = await IDB.getAll('users');
      user = users.find(u => u.username === loginId || u.email === loginId);
    }
    if (!user) throw new Error('Account Not Found: User not registered');
    if (user.password !== password) throw new Error('Invalid Password: Incorrect password');
    if (user.sixDigit !== sixDigit || user.fourDigit !== fourDigit) throw new Error('Invalid Codes: Codes do not match');
    localStorage.setItem('currentUser', user.email);
    showToast('Signed in successfully!');
    document.getElementById('login-modal').classList.add('hidden');
    if (user.email === 'boss@smarthub.com') {
      document.getElementById('boss-link').classList.remove('hidden');
    }
    showWelcome();
    onSuccess();
  } catch (error) {
    document.getElementById('auth-error').textContent = error.message;
    document.getElementById('auth-error').classList.remove('hidden');
    showToast(`Sign-in failed: ${error.message}`);
  } finally {
    document.getElementById('login-spinner').classList.add('hidden');
  }
}

async function recoverPassword() {
  const sixDigit = document.getElementById('recovery-six-digit').value;
  const fourDigit = document.getElementById('recovery-four-digit').value;
  const email = localStorage.getItem('currentUser');
  const user = await IDB.get('users', email);
  if (!user) {
    document.getElementById('recovery-error').textContent = 'Account Not Found: User not registered';
    document.getElementById('recovery-error').classList.remove('hidden');
    return;
  }
  if (user.sixDigit === sixDigit && user.fourDigit === fourDigit) {
    const newPassword = prompt('Enter new password (min 8 chars):');
    if (newPassword.length < 8) {
      document.getElementById('recovery-error').textContent = 'Invalid Password: Must be at least 8 characters';
      document.getElementById('recovery-error').classList.remove('hidden');
      return;
    }
    user.passwordChanges.push({ oldPassword: user.password, newPassword, timestamp: Date.now() });
    user.password = newPassword;
    await IDB.batchSet('users', [user]);
    firebase.database().ref('users/' + email.replace(/[^a-zA-Z0-9]/g, '')).update(user);
    showToast('Password updated!');
    document.getElementById('recovery-modal').classList.add('hidden');
  } else {
    document.getElementById('recovery-error').textContent = 'Invalid Codes: Codes do not match';
    document.getElementById('recovery-error').classList.remove('hidden');
  }
}

async function submitSupportTicket() {
  const ticket = {
    id: Date.now().toString(),
    username: document.getElementById('support-username').value,
    name: document.getElementById('support-name').value,
    email: document.getElementById('support-email').value,
    number: document.getElementById('support-number').value,
    message: document.getElementById('support-message').value,
    timestamp: Date.now()
  };
  await IDB.batchSet('support', [ticket]);
  firebase.database().ref('support/' + ticket.id).set(ticket);
  showToast('Support ticket submitted!');
  document.getElementById('support-modal').classList.add('hidden');
  logActivity(`Submitted support ticket: ${ticket.message}`);
}

function logActivity(action) {
  const log = {
    id: Date.now().toString(),
    user: localStorage.getItem('currentUser'),
    action,
    timestamp: Date.now()
  };
  IDB.batchSet('tracking', [log]);
  firebase.database().ref('tracking/' + log.id).set(log);
}
