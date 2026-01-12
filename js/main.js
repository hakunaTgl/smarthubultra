import { initializeApp } from 'firebase/app';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { showToast } from './utils.js';
import { loadCodeReference } from './codeReference.js';

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
  console.log('🚀 Starting Smart Hub Ultra initialization...');
  
  try {
    // Log app initialization for analytics
    logEvent(analytics, 'app_initialized');
    console.log('✅ Analytics initialized');

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      try {
        const swUrl = new URL('/sw.js', import.meta.url);
        const registration = await navigator.serviceWorker.register(swUrl, { scope: '/' });
        console.log('✅ Service Worker registered');
        
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showToast('New update available! Refresh to apply.');
            }
          });
        });
      } catch (swError) {
        console.warn('⚠️ Service Worker registration failed:', swError);
        showToast('Service Worker not available');
      }
    } else {
      console.log('ℹ️ Service Worker not supported');
    }

    // Add touch support for mobile
    if ('ontouchstart' in window) {
      document.body.classList.add('touch-device');
      console.log('✅ Touch device detected');
    }

    // Apply persisted theme preference
    try {
      const theme = localStorage.getItem('theme');
      if (theme === 'dark') {
        document.documentElement.classList.add('dark-mode');
      }
      console.log(`✅ Theme loaded: ${theme || 'light'}`);

      const dmToggle = document.getElementById('dark-mode-toggle');
      if (dmToggle) {
        dmToggle.addEventListener('click', () => {
          const isDark = document.documentElement.classList.toggle('dark-mode');
          localStorage.setItem('theme', isDark ? 'dark' : 'light');
          dmToggle.setAttribute('aria-pressed', String(isDark));
          dmToggle.textContent = isDark ? '🌞 Light' : '🌙 Dark';
          console.log(`🎨 Theme switched to: ${isDark ? 'dark' : 'light'}`);
        });
        
        // Set initial label
        if (document.documentElement.classList.contains('dark-mode')) {
          dmToggle.textContent = '🌞 Light';
          dmToggle.setAttribute('aria-pressed', 'true');
        }
        console.log('✅ Dark mode toggle configured');
      }

      // Voice recognition setup
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
          console.log('🎤 Voice recognition started');
        };
        
        recognizer.onend = () => {
          listening = false;
          voiceToggle.setAttribute('aria-pressed', 'false');
          if (voiceStatus) voiceStatus.textContent = '';
          console.log('🎤 Voice recognition ended');
        };
        
        recognizer.onresult = (ev) => {
          const transcript = Array.from(ev.results).map(r => r[0].transcript).join('');
          console.log('🎤 Voice input:', transcript);
          
          window.dispatchEvent(new CustomEvent('voice-command', { 
            detail: { text: transcript } 
          }));
          
          if (voiceStatus) {
            voiceStatus.textContent = `heard: "${transcript.slice(0, 60)}"`;
          }
        };
        
        voiceToggle.addEventListener('click', () => {
          if (!listening) {
            try { 
              recognizer.start(); 
            } catch (e) { 
              console.warn('⚠️ Recognizer start error:', e); 
            }
          } else {
            try { 
              recognizer.stop(); 
            } catch (e) { 
              console.warn('⚠️ Recognizer stop error:', e); 
            }
          }
        });
        
        console.log('✅ Voice recognition configured');
      } else if (voiceToggle) {
        voiceToggle.disabled = true;
        if (voiceStatus) voiceStatus.textContent = 'Voice not supported';
        console.log('ℹ️ Voice recognition not supported');
      }
    } catch (themeError) {
      console.error('❌ Theme/Voice initialization error:', themeError);
    }

    showToast('Smart Hub Ultra initialized');
    console.log('🎉 Smart Hub Ultra fully initialized!');

        // Load code reference system
    await loadCodeReference();
    console.log('✅ Code reference system loaded');
    
  } catch (error) {
    console.error('❌ Critical initialization error:', error);
    showToast(`Initialization failed: ${error.message}`);
    throw error;
  }
}

// Initialize the app with comprehensive error handling
console.log('📦 Main.js loaded, starting init...');
init().catch(error => {
  console.error('💥 FATAL: Initialization completely failed:', error);
  
  // Show user-friendly error overlay
  document.body.innerHTML += `
    <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                background: rgba(20,20,30,0.95); border: 2px solid #ff6b6b; border-radius: 12px;
                padding: 30px; color: white; text-align: center; z-index: 99999; max-width: 500px;">
      <h2 style="color: #ff6b6b; margin-top: 0;">⚠️ Initialization Failed</h2>
      <p style="margin: 20px 0;">Error: ${error.message}</p>
      <p style="font-size: 0.9em; opacity: 0.8;">Check browser console (F12) for details</p>
      <button onclick="location.reload()" 
              style="background: #4ecdc4; color: white; border: none; padding: 12px 24px;
                     border-radius: 6px; cursor: pointer; font-size: 16px; margin-top: 20px;">
        Reload Page
      </button>
    </div>
  `;
});
