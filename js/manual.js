import { showToast, speak } from './utils.js';

export async function loadManual() {
  try {
    speak('Welcome to the User Manual! Learn how to use Smart Hub Ultra.');
  } catch (error) {
    showToast(`Failed to load Manual: ${error.message}`);
    console.error('Manual Error:', error);
  }
}
