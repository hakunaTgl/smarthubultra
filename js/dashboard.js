import { showToast, speak, logActivity } from './utils.js';
import { runPredictiveTasks } from './predictiveTasks.js';
import { loadNotifications } from './notifications.js';
import { generateInstanceCode } from './auth.js';
import { loadSystemUpdates } from './updateLog.js';
import { getBotInsights, getBotActivity } from './bots.js';

export async function loadDashboard() {
  try {
    const user = localStorage.getItem('currentUser');
    if (user) {
      document.getElementById('welcome-message').textContent = `Welcome, ${user}`;
    }

    await loadNotifications();
    await Promise.all([
      renderBotSummary(),
      renderBotActivity(),
      loadSystemUpdates('system-updates')
    ]);
    await refreshServiceWorkerState();
    updateSystemStatus();
    registerStatusListeners();
    scheduleAutoRefresh();
    
    // Existing predictive tasks button
    const predictiveBtn = document.getElementById('predictive-btn');
    if (predictiveBtn) {
      predictiveBtn.addEventListener('click', runPredictiveTasks);
    }
    
    // New instance code generation
    const generateCodeBtn = document.getElementById('generate-code-btn');
    const copyCodeBtn = document.getElementById('copy-code-btn');
    const codeDisplay = document.getElementById('instance-code-display');
    const generatedCodeSpan = document.getElementById('generated-code');
    
    if (generateCodeBtn) {
      generateCodeBtn.addEventListener('click', async () => {
        try {
          const code = await generateInstanceCode(24); // 24 hours expiration
          generatedCodeSpan.textContent = code;
          codeDisplay.style.display = 'block';
          showToast('Instance code generated!');
          logActivity('Generated instance code');
        } catch (error) {
          showToast('Failed to generate instance code');
          console.error('Code generation error:', error);
        }
      });
    }
    
    if (copyCodeBtn) {
      copyCodeBtn.addEventListener('click', async () => {
        try {
          const code = generatedCodeSpan.textContent;
          await navigator.clipboard.writeText(code);
          showToast('Code copied to clipboard!');
        } catch (error) {
          showToast('Failed to copy code');
        }
      });
    }
    
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

async function renderBotSummary() {
  const grid = document.getElementById('bot-metrics-grid');
  const recentList = document.getElementById('bot-recent-list');
  if (!grid || !recentList) return;
  const insights = await getBotInsights();
  const statusCards = [
    { label: 'Total Bots', value: insights.total },
    { label: 'Active (24h)', value: insights.active24h },
    { label: 'Avg Runtime', value: `${insights.avgRuntime} ms` }
  ];
  grid.innerHTML = statusCards.map(card => `
    <div class="metric-card glassmorphic">
      <span class="metric-label">${card.label}</span>
      <strong class="metric-value">${card.value}</strong>
    </div>
  `).join('');

  const statusBreakdown = document.getElementById('bot-status-breakdown');
  if (statusBreakdown) {
    const entries = Object.entries(insights.statuses || {});
    statusBreakdown.innerHTML = entries.length ? entries.map(([status, count]) => `
      <span class="status-chip status-${status}">${status}: ${count}</span>
    `).join('') : '<span class="status-chip">No bots yet</span>';
  }

  recentList.innerHTML = insights.recent.length ? insights.recent.map(bot => `
    <li>
      <div>
        <strong>${bot.name}</strong>
        <p>${bot.purpose}</p>
      </div>
      <time>${formatTimestamp(bot.updatedAt || bot.createdAt)}</time>
    </li>
  `).join('') : '<li>No recent bot activity</li>';
}

async function renderBotActivity() {
  const feed = document.getElementById('bot-activity-feed');
  if (!feed) return;
  const entries = await getBotActivity();
  feed.innerHTML = entries.length ? entries.map(entry => `
    <div class="activity-row glassmorphic">
      <div>
        <strong>${entry.title}</strong>
        <p>${entry.details?.issues?.length ? entry.details.issues.join(', ') : renderActivityDetails(entry.details)}</p>
      </div>
      <time>${formatTimestamp(entry.timestamp)}</time>
    </div>
  `).join('') : '<p>No bot activity logged yet.</p>';
}

function renderActivityDetails(details) {
  if (!details || typeof details !== 'object') return '';
  const pairs = Object.entries(details).filter(([, value]) => value !== undefined && value !== null);
  if (!pairs.length) return '';
  return pairs.map(([key, value]) => `${key}: ${value}`).join(' • ');
}

let serviceWorkerState = 'Checking…';

async function refreshServiceWorkerState() {
  if (!('serviceWorker' in navigator)) {
    serviceWorkerState = 'Unsupported';
    updateSystemStatus();
    return;
  }
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      serviceWorkerState = 'Not registered';
    } else if (registration.waiting) {
      serviceWorkerState = 'Update available';
    } else if (registration.active) {
      serviceWorkerState = 'Active';
    } else {
      serviceWorkerState = 'Preparing';
    }
  } catch (error) {
    serviceWorkerState = 'Error';
    console.warn('Service worker status error', error);
  }
  updateSystemStatus();
}

function registerStatusListeners() {
  window.addEventListener('online', updateSystemStatus);
  window.addEventListener('offline', updateSystemStatus);
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      serviceWorkerState = 'Active';
      updateSystemStatus();
    });
  }
}

function updateSystemStatus() {
  const grid = document.getElementById('system-status-grid');
  if (!grid) return;
  const session = localStorage.getItem('currentSession');
  const statuses = [
    { label: 'Connection', value: navigator.onLine ? 'Online' : 'Offline', state: navigator.onLine ? 'ok' : 'warn' },
    { label: 'Service Worker', value: serviceWorkerState, state: serviceWorkerState === 'Active' ? 'ok' : 'info' },
    { label: 'Session', value: session ? 'Active' : 'Guest', state: session ? 'ok' : 'warn' }
  ];
  grid.innerHTML = statuses.map(status => `
    <div class="status-card glassmorphic status-${status.state}">
      <span class="status-label">${status.label}</span>
      <strong class="status-value">${status.value}</strong>
    </div>
  `).join('');
}

function scheduleAutoRefresh() {
  setInterval(() => {
    renderBotSummary();
    renderBotActivity();
    refreshServiceWorkerState();
  }, 60000);
}

function formatTimestamp(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}
