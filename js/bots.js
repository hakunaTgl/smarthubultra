import { IDB, showToast, speak, logActivity } from './utils.js';
import { dbRef, remove, set, getAuth } from './firebaseConfig.js';

const DEFAULT_TEMPLATES = [
  'Echo Bot',
  'Greeting Bot',
  'Support Bot',
  'Analytics Bot',
  'Notification Bot',
  'Scheduler Bot'
];

export async function populateBotTemplates() {
  try {
    const select = document.getElementById('bot-template');
    if (!select) return;
    select.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '-- Select Template --';
    select.appendChild(placeholder);
    DEFAULT_TEMPLATES.forEach(name => {
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
  await renderBotList();
  speak('Welcome to the Bots page!');
}

function renderBotCard(bot) {
  const card = document.createElement('div');
  card.className = 'bot-card glass-card';
  card.id = `bot-card-${bot.id}`;
  card.style.cssText = 'padding:1rem;border-radius:12px;margin-bottom:0.75rem;background:var(--glass-bg,rgba(255,255,255,0.05));border:1px solid rgba(255,255,255,0.1);display:flex;flex-direction:column;gap:0.5rem;';
  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <strong style="font-size:1rem;">${bot.name}</strong>
      <span id="bot-status-${bot.id}" style="font-size:0.75rem;padding:2px 8px;border-radius:20px;background:rgba(0,200,100,0.15);color:#00c864;">${bot.status || 'active'}</span>
    </div>
    <div style="font-size:0.82rem;color:var(--tone-soft,#aaa);">${bot.purpose || 'No purpose set'}</div>
    <div style="font-size:0.75rem;color:var(--tone-soft,#aaa);">Template: ${bot.template || 'Custom'} &bull; Created: ${new Date(bot.createdAt).toLocaleString()}</div>
    <div style="display:flex;gap:0.5rem;margin-top:0.25rem;">
      <button onclick="window.runBotById('${bot.id}')" style="flex:1;padding:0.4rem;border-radius:8px;border:none;background:rgba(99,102,241,0.2);color:#a5b4fc;cursor:pointer;font-size:0.82rem;">&#9654; Run</button>
      <button onclick="window.deleteBotById('${bot.id}')" style="padding:0.4rem 0.75rem;border-radius:8px;border:none;background:rgba(239,68,68,0.15);color:#fca5a5;cursor:pointer;font-size:0.82rem;">&#128465;</button>
    </div>
  `;
  return card;
}

async function renderBotList() {
  const container = document.getElementById('bot-list');
  if (!container) return;
  const botsData = await IDB.getAll('bots');
  const bots = Array.isArray(botsData) ? botsData.filter(b => !b._delete) : [];
  if (bots.length === 0) {
    container.innerHTML = '<p style="color:var(--tone-soft,#aaa);font-size:0.9rem;">No bots yet. Create your first bot above!</p>';
    return;
  }
  container.innerHTML = '';
  bots.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).forEach(bot => {
    container.appendChild(renderBotCard(bot));
  });
}

export async function createBotFromText() {
  const nameInput = document.getElementById('bot-name');
  const purposeInput = document.getElementById('bot-purpose');
  const templateSelect = document.getElementById('bot-template');

  const name = (nameInput ? nameInput.value.trim() : '');
  const purpose = (purposeInput ? purposeInput.value.trim() : '');
  const template = (templateSelect ? templateSelect.value : 'Echo Bot');

  if (!name || name.length < 3 || name.length > 50) {
    showToast('Bot name must be between 3 and 50 characters.');
    return;
  }

  const id = `bot_${Date.now()}`;
  const bot = {
    id,
    name,
    purpose: purpose || 'General purpose bot',
    template: template || 'Echo Bot',
    status: 'active',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    runtime: 0,
    lastRun: null
  };

  // Save to IndexedDB
  await IDB.batchSet('bots', [bot]);

  // Save to Firebase if user is authenticated
  try {
    const auth = getAuth();
    const user = auth && auth.currentUser;
    const uid = user ? user.uid : (JSON.parse(localStorage.getItem('currentUser') || '{}').uid || 'guest');
    await set(dbRef(`users/${uid}/bots/${id}`), bot);
  } catch (err) {
    console.warn('Firebase save skipped:', err);
  }

  // Update DOM
  const container = document.getElementById('bot-list');
  if (container) {
    const placeholder = container.querySelector('p');
    if (placeholder) placeholder.remove();
    container.prepend(renderBotCard(bot));
  }

  // Clear inputs
  if (nameInput) nameInput.value = '';
  if (purposeInput) purposeInput.value = '';
  if (templateSelect) templateSelect.selectedIndex = 0;

  logActivity(`Created bot: ${name}`);
  showToast(`Bot "${name}" created successfully!`);
  speak(`Bot ${name} created.`);
}

export async function runBot(id) {
  const statusEl = document.getElementById(`bot-status-${id}`);
  if (statusEl) {
    statusEl.textContent = 'running...';
    statusEl.style.background = 'rgba(251,191,36,0.15)';
    statusEl.style.color = '#fbbf24';
  }

  // Update in IDB
  try {
    const botsData = await IDB.getAll('bots');
    const bots = Array.isArray(botsData) ? botsData : [];
    const bot = bots.find(b => b.id === id);
    if (bot) {
      bot.status = 'running';
      bot.lastRun = Date.now();
      bot.runtime = (bot.runtime || 0) + 1;
      await IDB.batchSet('bots', [bot]);
      // Update Firebase
      try {
        const auth = getAuth();
        const user = auth && auth.currentUser;
        const uid = user ? user.uid : (JSON.parse(localStorage.getItem('currentUser') || '{}').uid || 'guest');
        await set(dbRef(`users/${uid}/bots/${id}`), bot);
      } catch (e) { /* silent */ }
    }
  } catch (err) {
    console.warn('runBot IDB error:', err);
  }

  logActivity(`Run bot ${id}`);
  showToast(`Bot ${id} is running...`);

  setTimeout(async () => {
    if (statusEl) {
      statusEl.textContent = 'active';
      statusEl.style.background = 'rgba(0,200,100,0.15)';
      statusEl.style.color = '#00c864';
    }
    try {
      const botsData = await IDB.getAll('bots');
      const bots = Array.isArray(botsData) ? botsData : [];
      const bot = bots.find(b => b.id === id);
      if (bot) {
        bot.status = 'active';
        bot.updatedAt = Date.now();
        await IDB.batchSet('bots', [bot]);
      }
    } catch (e) { /* silent */ }
    showToast(`Bot ${id} completed execution.`);
  }, 2000);
}

// Expose to global scope for inline onclick handlers
window.runBotById = runBot;
window.deleteBotById = deleteBot;

export async function deleteBot(id) {
  const card = document.getElementById(`bot-card-${id}`);
  if (card) card.remove();

  await IDB.batchSet('bots', [{ id, _delete: true }]);
  try {
    await remove(dbRef(`bots/${id}`));
  } catch (err) {
    console.warn('Failed to remove bot from Firebase:', err);
  }
  // Check if list is now empty
  const container = document.getElementById('bot-list');
  if (container && container.children.length === 0) {
    container.innerHTML = '<p style="color:var(--tone-soft,#aaa);font-size:0.9rem;">No bots yet. Create your first bot above!</p>';
  }
  showToast('Bot deleted');
  logActivity(`Deleted bot ${id}`);
}

export async function getBotInsights() {
  try {
    const botsData = await IDB.getAll('bots');
    const bots = Array.isArray(botsData) ? botsData.filter(b => !b._delete) : [];
    const now = Date.now();
    const oneDayAgo = now - 86400000;
    const total = bots.length;
    const active24h = bots.filter(bot => bot.lastRun && bot.lastRun > oneDayAgo).length;
    const totalRuntime = bots.reduce((sum, bot) => sum + (bot.runtime || 0), 0);
    const avgRuntime = total > 0 ? Math.round(totalRuntime / total) : 0;
    const statuses = bots.reduce((acc, bot) => {
      const status = bot.status || 'active';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    const categories = bots.reduce((acc, bot) => {
      const category = bot.category || 'general';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    const recent = bots
      .slice()
      .sort((a, b) => {
        const timeA = a.updatedAt || a.createdAt || 0;
        const timeB = b.updatedAt || b.createdAt || 0;
        return timeB - timeA;
      })
      .slice(0, 5);
    return { total, active24h, avgRuntime, statuses, categories, recent };
  } catch (error) {
    console.error('Failed to get bot insights:', error);
    return { total: 0, active24h: 0, avgRuntime: 0, statuses: {}, categories: {}, recent: [] };
  }
}

export async function getBotActivity() {
  try {
    const logsData = await IDB.getAll('tracking');
    const logs = Array.isArray(logsData) ? logsData : [];
    const botLogs = logs
      .filter(log => {
        const action = String(log.action || '').toLowerCase();
        return action.includes('bot') || action.includes('run bot') || action.includes('created bot') || action.includes('deleted bot');
      })
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 10)
      .map(log => ({
        title: log.action || 'Bot Activity',
        details: {
          user: log.user,
          ...(log.codeSuffix !== undefined && { codeSuffix: log.codeSuffix }),
          ...(log.length !== undefined && { length: log.length })
        },
        timestamp: log.timestamp || Date.now()
      }));
    return botLogs;
  } catch (error) {
    console.error('Failed to get bot activity:', error);
    return [];
  }
}
