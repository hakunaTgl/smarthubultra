import { initializeAuth } from './auth.js';
import { loadDashboard } from './dashboard.js';
import { loadBotsPage } from './bots.js';
import { loadInspirationLab } from './inspiration.js';
import { setupBotBuilder } from './builder.js';
import { loadAIWorkshop } from './workshop.js';
import { loadEditor } from './editor.js';
import { loadPlayground } from './playground.js';
import { loadCreatorsHub } from './creators.js';
import { loadCollabHub } from './collab.js';
import { loadVoiceCommand } from './voice.js';
import { loadAnalytics } from './analytics.js';
import { loadAccount } from './account.js';
import { loadManual } from './manual.js';
import { loadBossView } from './boss.js';
import { startHoloGuide } from './holoGuide.js';
import { setupARControlMode } from './arControl.js';
import { loadNotifications } from './notifications.js';
import { showToast, speak, closeAllModals } from './utils.js';

// Firebase Initialization
const firebaseConfig = {
  apiKey: "AIzaSyC8qPo1m1Na6u20e3b3Qf8eCfk5EBn15o",
  authDomain: "smarthubultra.firebaseapp.com",
  databaseURL: "https://smarthubultra-default-rtdb.firebaseio.com",
  projectId: "smarthubultra",
  storageBucket: "smarthubultra.appspot.com",
  messagingSenderId: "1045339361627",
  appId: "1:1045339361627:web:6d3a5c7e1e1d2f5a4b3c2d",
  measurementId: "G-5X7Y2T8Z9Q"
};
firebase.initializeApp(firebaseConfig);

// Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(() => console.log('Service Worker Registered'));
}

// Loading Screen
let progress = 0;
const progressBar = document.getElementById('progress');
const loadingInterval = setInterval(() => {
  progress += 10;
  progressBar.style.width = `${progress}%`;
  if (progress >= 100) {
    clearInterval(loadingInterval);
    document.getElementById('loading-screen').classList.add('hidden');
    document.getElementById('login-modal').classList.remove('hidden');
  }
}, 300);

// Modal Navigation
document.querySelectorAll('.sidebar a').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    closeAllModals();
    const modalId = link.dataset.modal;
    document.getElementById(modalId).classList.remove('hidden');
    if (modalId === 'dashboard-modal') loadDashboard();
    else if (modalId === 'bots-modal') loadBotsPage();
    else if (modalId === 'inspiration-modal') loadInspirationLab();
    else if (modalId === 'builder-modal') setupBotBuilder();
    else if (modalId === 'workshop-modal') loadAIWorkshop();
    else if (modalId === 'editor-modal') loadEditor();
    else if (modalId === 'playground-modal') loadPlayground();
    else if (modalId === 'creators-modal') loadCreatorsHub();
    else if (modalId === 'collab-modal') loadCollabHub();
    else if (modalId === 'voice-modal') loadVoiceCommand();
    else if (modalId === 'analytics-modal') loadAnalytics();
    else if (modalId === 'account-modal') loadAccount();
    else if (modalId === 'manual-modal') loadManual();
    else if (modalId === 'boss-modal') loadBossView();
    speak(`Opened ${modalId.replace('-modal', '')} section.`);
  });
});

document.querySelectorAll('.close-modal').forEach(btn => {
  btn.addEventListener('click', closeAllModals));

// Initialize Modules
initializeAuth(() => {
  document.getElementById('sidebar').classList.remove('hidden');
  document.getElementById('notification-bell').classList.remove('hidden');
  startHoloGuide();
  setupARControlMode();
  loadNotifications();
});

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('currentUser');
  closeAllModals();
  document.getElementById('login-modal').classList.remove('hidden');
  document.getElementById('sidebar').classList.add('hidden');
  document.getElementById('notification-bell').classList.add('hidden');
  showToast('Logged out successfully');
});
