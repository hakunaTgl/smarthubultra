import { showToast } from './utils.js';

export async function connectO7(apiKey) {
  try {
    if (!apiKey) {
      showToast('Provide an O7 API key');
      return;
    }
    localStorage.setItem('o7ApiKey', apiKey);
    // Placeholder for real integration
    showToast('O7 integration enabled');
  } catch (error) {
    showToast(`O7 integration failed: ${error.message}`);
  }
}
