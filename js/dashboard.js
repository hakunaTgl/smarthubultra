import { showToast, speak, logActivity } from './utils.js';
import { runPredictiveTasks } from './predictiveTasks.js';
import { loadNotifications } from './notifications.js';
import { generateInstanceCode } from './auth.js';
import { loadSystemUpdates } from './updateLog.js';
import { getBotInsights, getBotActivity } from './bots.js';
import { collectSystemStatus, onSystemStatusUpdate, startSystemPulse } from './systemStatus.js';

const DASHBOARD_STATE = window.__shuDashboardState || (window.__shuDashboardState = {});
const BOT_REFRESH_INTERVAL = 20000;

export async function loadDashboard() {
  try {
    const user = localStorage.getItem('currentUser');
    if (user) {
      document.getElementById('welcome-message').textContent = `Welcome, ${user}`;
    }

    await loadNotifications();

    await Promise.all([
      loadSystemUpdates('system-updates'),
      renderBotMetrics(),
      renderBotActivity(),
      renderSystemStatus()
    ]);

    await ensureStatusPulse();
    scheduleBotRefresh();
    
    // Existing predictive tasks button
    const predictiveBtn = document.getElementById('predictive-btn');
    if (predictiveBtn) {
      predictiveBtn.addEventListener('click', runPredictiveTasks);
    }
    
    wireInstanceCodeControls();
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
  if (!weatherDiv) return;
  const conditions = ['Sunny', 'Partly Cloudy', 'Clear Skies', 'High Energy'];
  const condition = conditions[new Date().getDay() % conditions.length];
  weatherDiv.textContent = `72°F • ${condition}`;
}

async function renderBotMetrics() {
  const grid = document.getElementById('bot-metrics-grid');
  const recentList = document.getElementById('bot-recent-list');
  const statusBreakdown = document.getElementById('bot-status-breakdown');
  if (!grid || !recentList || !statusBreakdown) return;
  const insights = await getBotInsights();
  renderMetricCards(grid, insights);
  renderStatusBreakdown(statusBreakdown, insights.statuses);
  renderRecentBots(recentList, insights.recent);
  updateInsightsPanels(insights);
  return insights;
}

async function renderBotActivity() {
  const feed = document.getElementById('bot-activity-feed');
  if (!feed) return;
  const entries = await getBotActivity();
  feed.innerHTML = entries.length ? entries.map(entry => `
    <div class="activity-row glassmorphic">
      <div>
        <strong>${entry.title}</strong>
        <p>${summariseDetails(entry.details) || 'No additional details'}</p>
      </div>
      <time>${formatRelativeTime(entry.timestamp)}</time>
    </div>
  `).join('') : '<p>No bot activity logged yet.</p>';
}

async function renderSystemStatus(snapshot) {
  const grid = document.getElementById('system-status-grid');
  if (!grid) return;
  const statuses = snapshot || await collectSystemStatus();
  grid.innerHTML = statuses.map(status => `
    <div class="status-card glassmorphic ${severityClass(status.severity)}">
      <span class="status-label">${status.label}</span>
      <strong class="status-value">${status.value}</strong>
      <small class="status-detail">${status.detail || ''}</small>
    </div>
  `).join('');
}

async function ensureStatusPulse() {
  if (DASHBOARD_STATE.unsubStatus) {
    DASHBOARD_STATE.unsubStatus();
    DASHBOARD_STATE.unsubStatus = undefined;
  }
  await startSystemPulse();
  DASHBOARD_STATE.unsubStatus = onSystemStatusUpdate(renderSystemStatus);
}

function scheduleBotRefresh() {
  if (DASHBOARD_STATE.botRefreshInterval) return;
  DASHBOARD_STATE.botRefreshInterval = setInterval(async () => {
    const insights = await renderBotMetrics();
    if (insights) {
      updateInsightsPanels(insights);
    }
    await renderBotActivity();
  }, BOT_REFRESH_INTERVAL);
}

function renderMetricCards(container, insights) {
  const cards = [
    { label: 'Total Bots', value: insights.total },
    { label: 'Active (24h)', value: insights.active24h },
    { label: 'Avg Runtime', value: `${insights.avgRuntime} ms` }
  ];
  container.innerHTML = cards.map(card => `
    <div class="metric-card glassmorphic">
      <span class="metric-label">${card.label}</span>
      <strong class="metric-value">${card.value}</strong>
    </div>
  `).join('');
}

function renderStatusBreakdown(container, breakdown = {}) {
  const entries = Object.entries(breakdown);
  container.innerHTML = entries.length ? entries.map(([status, count]) => `
    <span class="status-chip">${status}: ${count}</span>
  `).join('') : '<span class="status-chip">No bots yet</span>';
}

function renderRecentBots(container, bots = []) {
  if (!bots.length) {
    container.innerHTML = '<li>No recent bot activity</li>';
    return;
  }
  container.innerHTML = bots.map(bot => `
    <li>
      <div>
        <strong>${bot.name}</strong>
        <p>${bot.purpose}</p>
      </div>
      <time>${formatRelativeTime(bot.updatedAt || bot.createdAt)}</time>
    </li>
  `).join('');
}

function updateInsightsPanels(insights) {
  const insightsDiv = document.getElementById('ai-insights');
  const challengesDiv = document.getElementById('daily-challenges');
  if (insightsDiv) {
    const topCategory = pickTopEntry(insights.categories);
    insightsDiv.innerHTML = topCategory
      ? `<p><strong>${topCategory.key}</strong> leads with ${topCategory.value} bots. Consider diversifying automation coverage.</p>`
      : '<p>Deploy your first bot to unlock AI insights.</p>';
  }
  if (challengesDiv) {
    const tasks = buildDailyChallenges(insights);
    challengesDiv.innerHTML = tasks.length
      ? `<ul>${tasks.map(task => `<li>${task}</li>`).join('')}</ul>`
      : '<p>No challenges yet. Create a bot to get personalised quests.</p>';
  }
}

function buildDailyChallenges(insights) {
  if (!insights.total) {
    return ['Generate an instance code and invite a collaborator.', 'Create your first automation bot using a starter template.'];
  }
  const challenges = [
    'Run predictive tasks to validate bot guardrails.',
    'Export a bot blueprint and archive it for rollback readiness.'
  ];
  if (insights.active24h < insights.total) {
    challenges.push('Activate dormant bots or archive ones you no longer need.');
  }
  if ((insights.statuses?.flagged || 0) > 0) {
    challenges.push('Resolve flagged bots: review behavioural DNA mismatches.');
  }
  return challenges.slice(0, 3);
}

function pickTopEntry(map = {}) {
  const entries = Object.entries(map);
  if (!entries.length) return null;
  return entries.map(([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value)[0];
}

function summariseDetails(details) {
  if (!details || typeof details !== 'object') return '';
  if (Array.isArray(details)) return details.join(', ');
  const entries = Object.entries(details)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}: ${String(value).slice(0, 64)}`);
  return entries.length ? entries.join(' • ') : '';
}

function severityClass(severity = 'info') {
  return `status-${severity}`;
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return '—';
  const elapsed = Date.now() - timestamp;
  const minutes = Math.round(elapsed / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function wireInstanceCodeControls() {
  const generateCodeBtn = document.getElementById('generate-code-btn');
  const copyCodeBtn = document.getElementById('copy-code-btn');
  const codeDisplay = document.getElementById('instance-code-display');
  const generatedCodeSpan = document.getElementById('generated-code');

  if (generateCodeBtn) {
    generateCodeBtn.addEventListener('click', async () => {
      try {
  const code = await generateInstanceCode(24);
  if (generatedCodeSpan) generatedCodeSpan.textContent = code;
  if (codeDisplay) codeDisplay.style.display = 'block';
  showToast('Instance code generated!');
  logActivity('Generated instance code', { codeSuffix: code.slice(-4) });
      } catch (error) {
        showToast('Failed to generate instance code');
        console.error('Code generation error:', error);
      }
    });
  }

  if (copyCodeBtn) {
    copyCodeBtn.addEventListener('click', async () => {
      try {
        const code = generatedCodeSpan?.textContent;
        if (!code) {
          showToast('Generate a code first');
          return;
        }
        await navigator.clipboard.writeText(code);
        showToast('Code copied to clipboard!');
      } catch (error) {
        showToast('Failed to copy code');
      }
    });
  }
}
