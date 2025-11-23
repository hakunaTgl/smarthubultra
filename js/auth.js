import { showToast, speak, logActivity, closeAllModals } from './utils.js';
import { loadDashboard } from './dashboard.js';
import { startHoloGuide } from './holoGuide.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { getDatabase, ref, set, get } from 'firebase/database';
import { app } from './firebaseConfig.js';

const auth = getAuth(app);
const database = getDatabase(app);

export async function loadAuth() {
  try {
    document.getElementById('auth-modal').classList.remove('hidden');

    document.getElementById('sign-up-form').addEventListener('submit', async e => {
      e.preventDefault();
      const email = document.getElementById('sign-up-email').value;
      const password = document.getElementById('sign-up-password').value;
      const username = document.getElementById('sign-up-username').value;
      if (password.length < 8) {
        showToast('Invalid Password: Must be at least 8 characters');
        return;
      }
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = {
          email,
          username,
          password,
          sixDigit: document.getElementById('sign-up-six-digit').value,
          fourDigit: document.getElementById('sign-up-four-digit').value,
          role: 'user',
          points: 0,
          level: 1,
          xp: 0,
          badges: [],
          passwordChanges: []
        };
        await set(ref(database, 'users/' + email.replace(/[^a-zA-Z0-9]/g, '')), user);
        localStorage.setItem('currentUser', email);
        showToast('Sign-up successful! Welcome to Smart Hub Ultra.');
        logActivity('User signed up');
        closeAllModals();
        await startHoloGuide();
        await loadDashboard();
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          showToast('Email already in use');
        } else if (error.code === 'auth/invalid-email') {
          showToast('Invalid Email Format');
        } else {
          showToast(`Sign-up failed: ${error.message}`);
        }
      }
    });

    document.getElementById('sign-in-form').addEventListener('submit', async e => {
      e.preventDefault();
      const email = document.getElementById('sign-in-email').value;
      const password = document.getElementById('sign-in-password').value;
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        localStorage.setItem('currentUser', email);
        const userSnap = await get(ref(database, 'users/' + email.replace(/[^a-zA-Z0-9]/g, '')));
        if (!userSnap.exists()) {
          showToast('Not Set Up Yet: Complete user profile');
          return;
        }
        showToast('Sign-in successful!');
        logActivity('User signed in');
        closeAllModals();
        await loadDashboard();
      } catch (error) {
        if (error.code === 'auth/wrong-password') {
          showToast('Invalid Password');
        } else if (error.code === 'auth/user-not-found') {
          showToast('User Not Found');
        } else {
          showToast(`Sign-in failed: ${error.message}`);
        }
      }
    });

    document.getElementById('forgot-password').addEventListener('click', async () => {
      const email = document.getElementById('sign-in-email').value;
      if (!email) {
        showToast('Enter email to reset password');
        return;
      }
      try {
        await sendPasswordResetEmail(auth, email);
        showToast('Password reset email sent');
        logActivity('Requested password reset');
      } catch (error) {
        showToast(`Password reset failed: ${error.message}`);
      }
    });

    document.getElementById('support-form').addEventListener('submit', async e => {
      e.preventDefault();
      const email = document.getElementById('support-email').value;
      const message = document.getElementById('support-message').value;
      const ticket = {
        id: Date.now().toString(),
        email,
        message,
        timestamp: Date.now()
      };
      await set(ref(database, 'support/' + ticket.id), ticket);
      showToast('Support ticket submitted');
      logActivity('Submitted support ticket');
      e.target.reset();
    });

    speak('Welcome to Smart Hub Ultra! Sign up or sign in to start.');
  } catch (error) {
    showToast(`Auth setup failed: ${error.message}`);
    console.error('Auth Error:', error);
  }
}
