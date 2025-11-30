import { logEvent } from 'firebase/analytics';
import { showToast } from './utils.js';
import { analytics } from './firebaseConfig.js';

async function init() {
  try {
    // Log app initialization for analytics
    logEvent(analytics, 'app_initialized');

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showToast('New update available! Refresh to apply.');
          }
        });
      });
    } else {
      showToast('Service Worker not supported');
    }

    // Add touch support for mobile
    if ('ontouchstart' in window) {
      document.body.classList.add('touch-device');
    }

    showToast('Smart Hub Ultra initialized');
  } catch (error) {
    showToast(`Initialization failed: ${error.message}`);
    console.error('Init Error:', error);
  }
}

init();
