import { showToast, speak, logActivity } from './utils.js';
import { runPredictiveTasks } from './predictiveTasks.js';
import { loadNotifications } from './notifications.js';

export async function loadDashboard() {
  try {
    const user = localStorage.getItem('currentUser');
    if (user) {
      document.getElementById('welcome-message').textContent = `Welcome, ${user}`;
    }

    await loadNotifications();
    document.getElementById('predictive-btn').addEventListener('click', runPredictiveTasks);
    displayWeather();

    showToast('Dashboard loaded');
    logActivity('Loaded dashboard');
    speak('Welcome to the dashboard!');
  } catch (error) {
    showToast(`Failed to load dashboard: ${error.message}`);
    console.error('Dashboard Error:', error);
  }
}

function displayWeather() {
  const weatherDiv = document.getElementById('weather');
  weatherDiv.textContent = '72°F and Sunny';
}
