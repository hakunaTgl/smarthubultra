import { initializeApp } from 'firebase/app';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { showToast } from './utils.js';

const firebaseConfig = {
  apiKey: "AIzaSyAPPllpKiFOcjqxnuk2tRvithFYKSzkQAc",
  authDomain: "smarthubultra.firebaseapp.com",
  databaseURL: "https://smarthubultra-default-rtdb.firebaseio.com",
  projectId: "smarthubultra",
  storageBucket: "smarthubultra.firebasestorage.app",
  messagingSenderId: "12039705608",
  appId: "1:12039705608:web:f1a4383b245275eaa26dbd",
  measurementId: "G-V24P3DHL9M"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

async function init() {
  try {
    // Log app initialization for analytics
    logEvent(analytics, 'app_initialized');

    // Register Service Worker
    if ('serviceWorker' in navigator) {
  // Use a URL object so bundlers can correctly reference the built service worker
  const swUrl = new URL('/sw.js', import.meta.url);
  const registration = await navigator.serviceWorker.register(swUrl, { scope: '/' });
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
    // Apply persisted theme preference
    try {
      const theme = localStorage.getItem('theme');
      if (theme === 'dark') document.documentElement.classList.add('dark-mode');
      const dmToggle = document.getElementById('dark-mode-toggle');
      if (dmToggle) {
        dmToggle.addEventListener('click', () => {
          const isDark = document.documentElement.classList.toggle('dark-mode');
          localStorage.setItem('theme', isDark ? 'dark' : 'light');
          dmToggle.setAttribute('aria-pressed', String(isDark));
          dmToggle.textContent = isDark ? '🌞 Light' : '🌙 Dark';
        });
        // initial label
        if (document.documentElement.classList.contains('dark-mode')) dmToggle.textContent = '🌞 Light';
      }

      // Basic voice recognition toggle
      const voiceToggle = document.getElementById('voice-toggle');
      const voiceStatus = document.getElementById('voice-status');
      if (voiceToggle && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognizer = new SpeechRec();
        recognizer.continuous = false;
        recognizer.interimResults = false;
        recognizer.lang = 'en-US';
        let listening = false;

        recognizer.onstart = () => {
          listening = true;
          voiceToggle.setAttribute('aria-pressed', 'true');
          if (voiceStatus) voiceStatus.textContent = 'listening...';
        };
        recognizer.onend = () => {
          listening = false;
          voiceToggle.setAttribute('aria-pressed', 'false');
          if (voiceStatus) voiceStatus.textContent = '';
        };
        recognizer.onresult = (ev) => {
          const transcript = Array.from(ev.results).map(r => r[0].transcript).join('');
          console.log('Voice input:', transcript);
          // Dispatch a custom event so other modules (playground, editor) can listen
          window.dispatchEvent(new CustomEvent('voice-command', { detail: { text: transcript } }));
          if (voiceStatus) voiceStatus.textContent = `heard: "${transcript.slice(0,60)}"`;
        };

        voiceToggle.addEventListener('click', () => {
          if (!listening) {
            try { recognizer.start(); } catch (e) { console.warn('recognizer start error', e); }
          } else {
            try { recognizer.stop(); } catch (e) { console.warn('recognizer stop error', e); }
          }
        });
      } else if (voiceToggle) {
        voiceToggle.disabled = true;
        if (voiceStatus) voiceStatus.textContent = 'Voice not supported';
      }
    } catch (e) {
      console.warn('theme/voice init failed', e);
    }
  } catch (error) {
    showToast(`Initialization failed: ${error.message}`);
    console.error('Init Error:', error);
  }
}

init();
