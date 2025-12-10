import { IDB, showToast, speak, logActivity } from './utils.js';

const DEFAULT_TEMPLATES = [
  'Echo Bot',
  'Greeting Bot',
  'Support Bot'
];

export async function populateBotTemplates() {
  try {
    const select = document.getElementById('bot-template');
    if (!select) return;
    select.innerHTML = '';
    const templates = DEFAULT_TEMPLATES;
    templates.forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });
  } catch (err) {
    console.error('Failed to load templates', err);
  }
}

export async function loadBotsPage() {
  await populateBotTemplates();
  speak('Welcome to the Bots page!');
}

export async function createBotFromText() {
  showToast('Bot creation from text is not implemented in this demo.');
}

export async function runBot(id) {
  showToast(`Running bot ${id} (demo)`);
  logActivity(`Run bot ${id}`);
}

export async function deleteBot(id) {
  await IDB.batchSet('bots', [{ id, _delete: true }]);
  firebase.database().ref('bots/' + id).remove();
  showToast('Bot deleted');
  logActivity(`Deleted bot ${id}`);
}

export async function getBotInsights() {
  try {
    const botsData = await IDB.getAll('bots');
    const bots = Array.isArray(botsData) ? botsData : [];
    const now = Date.now();
    const oneDayAgo = now - 86400000; // 24 hours in milliseconds

    // Calculate metrics
    const total = bots.length;
    const active24h = bots.filter(bot => bot.lastRun && bot.lastRun > oneDayAgo).length;
    const totalRuntime = bots.reduce((sum, bot) => sum + (bot.runtime || 0), 0);
    const avgRuntime = total > 0 ? Math.round(totalRuntime / total) : 0;

    // Group by status
    const statuses = bots.reduce((acc, bot) => {
      const status = bot.status || 'active';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Group by category
    const categories = bots.reduce((acc, bot) => {
      const category = bot.category || 'general';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    // Get recent bots (sorted by updatedAt or createdAt)
    const recent = bots
      .slice()
      .sort((a, b) => {
        const timeA = a.updatedAt || a.createdAt || 0;
        const timeB = b.updatedAt || b.createdAt || 0;
        return timeB - timeA;
      })
      .slice(0, 5);

    return {
      total,
      active24h,
      avgRuntime,
      statuses,
      categories,
      recent
    };
  } catch (error) {
    console.error('Failed to get bot insights:', error);
    return {
      total: 0,
      active24h: 0,
      avgRuntime: 0,
      statuses: {},
      categories: {},
      recent: []
    };
  }
}

export async function getBotActivity() {
  try {
    const logsData = await IDB.getAll('tracking');
    const logs = Array.isArray(logsData) ? logsData : [];
    const botLogs = logs
      .filter(log => {
        const action = String(log.action || '').toLowerCase();
        return action.includes('bot') || action.includes('run') || action.includes('created') || action.includes('deleted');
      })
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 10)
      .map(log => ({
        title: log.action || 'Bot Activity',
        details: {
          user: log.user,
          ...(log.codeSuffix && { codeSuffix: log.codeSuffix }),
          ...(log.length && { length: log.length })
        },
        timestamp: log.timestamp || Date.now()
      }));

    return botLogs;
  } catch (error) {
    console.error('Failed to get bot activity:', error);
    return [];
  }
}

