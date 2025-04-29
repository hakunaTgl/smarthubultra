import { showToast, speak, logActivity } from './utils.js';
import { loadBotsPage } from './bots.js';
import { loadInspirationLab } from './inspiration.js';
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
import { setupARControlMode } from './arControl.js';
import { runPredictiveTasks } from './predictiveTasks.js';
import { loadNotifications } from './notifications.js';

export async function loadDashboard() {
  try {
    document.getElementById('dashboard-modal').classList.remove('hidden');
    const user = localStorage.getItem('currentUser');
    document.getElementById('welcome-message').textContent = `Welcome, ${user.split('@')[0]}!`;
    
    const weather = await fetchWeather();
    document.getElementById('weather').innerHTML = `<p>${weather.city}: ${weather.temp}°C, ${weather.condition}</p>`;
    
    const insights = await fetchAIInsights();
    document.getElementById('ai-insights').innerHTML = insights.map(i => `<p>${i}</p>`).join('');
    
    const challenges = await fetchDailyChallenges();
    document.getElementById('daily-challenges').innerHTML = challenges.map(c => `<p>${c}</p>`).join('');

    document.getElementById('bots-btn').addEventListener('click', () => {
      document.getElementById('dashboard-modal').classList.add('hidden');
      loadBotsPage();
    });

    document.getElementById('inspiration-btn').addEventListener('click', () => {
      document.getElementById('dashboard-modal').classList.add('hidden');
      loadInspirationLab();
    });

    document.getElementById('workshop-btn').addEventListener('click', () => {
      document.getElementById('dashboard-modal').classList.add('hidden');
      loadAIWorkshop();
    });

    document.getElementById('editor-btn').addEventListener('click', () => {
      document.getElementById('dashboard-modal').classList.add('hidden');
      loadEditor();
    });

    document.getElementById('playground-btn').addEventListener('click', () => {
      document.getElementById('dashboard-modal').classList.add('hidden');
      loadPlayground();
    });

    document.getElementById('creators-btn').addEventListener('click', () => {
      document.getElementById('dashboard-modal').classList.add('hidden');
      loadCreatorsHub();
    });

    document.getElementById('collab-btn').addEventListener('click', () => {
      document.getElementById('dashboard-modal').classList.add('hidden');
      loadCollabHub();
    });

    document.getElementById('voice-btn').addEventListener('click', () => {
      document.getElementById('dashboard-modal').classList.add('hidden');
      loadVoiceCommand();
    });

    document.getElementById('analytics-btn').addEventListener('click', () => {
      document.getElementById('dashboard-modal').classList.add('hidden');
      loadAnalytics();
    });

    document.getElementById('account-btn').addEventListener('click', () => {
      document.getElementById('dashboard-modal').classList.add('hidden');
      loadAccount();
    });

    document.getElementById('manual-btn').addEventListener('click', () => {
      document.getElementById('dashboard-modal').classList.add('hidden');
      loadManual();
    });

    document.getElementById('boss-btn').addEventListener('click', () => {
      document.getElementById('dashboard-modal').classList.add('hidden');
      loadBossView();
    });

    document.getElementById('ar-btn').addEventListener('click', () => {
      document.getElementById('dashboard-modal').classList.add('hidden');
      setupARControlMode();
    });

    document.getElementById('predictive-btn').addEventListener('click', () => {
      runPredictiveTasks();
    });

    await loadNotifications();
    speak('Dashboard loaded! Explore your bots and insights.');
    logActivity('Loaded dashboard');
  } catch (error) {
    showToast(`Failed to load Dashboard: ${error.message}`);
    console.error('Dashboard Error:', error);
  }
}

async function fetchWeather() {
  // Simulate weather API
  return { city: 'New York', temp: 20, condition: 'Sunny' };
}

async function fetchAIInsights() {
  // Simulate AI insights
  return ['Optimize your bots for faster runtime.', 'Try the new bot templates!'];
}

async function fetchDailyChallenges() {
  // Simulate daily challenges
  return ['Create a bot that fetches memes.', 'Collaborate on a bot with a friend.'];
}
