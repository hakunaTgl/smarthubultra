import { IDB, showToast, logActivity } from './utils.js';
import { dbRef, set, update, remove, get, onChildAdded, onChildChanged, onChildRemoved } from './firebaseConfig.js';
import { generateBehavioralDNA, validateBotBehavior } from './behavioralDNA.js';

const BOT_TEMPLATES = [
  {
    id: 'support-concierge',
    name: 'Support Concierge',
    purpose: 'Provide tier-1 support triage and escalate critical tickets',
    code: `function handleTicket(ticket) {
  if (ticket.priority === 'critical') {
    notifySupervisor(ticket);
  }
  return buildReply(ticket);
}`,
    tags: ['support', 'triage', 'livechat'],
    roadmap: ['Ingest support knowledge base', 'Automate response templates', 'Escalate critical alerts']
  },
  {
    id: 'sales-navigator',
    name: 'Sales Navigator',
    purpose: 'Qualify inbound leads and schedule discovery calls automatically',
    code: `async function qualifyLead(lead) {
  const score = await enrichLead(lead);
  if (score > 75) {
    return scheduleCall(lead);
  }
  return sendNurtureSequence(lead);
}`,
    tags: ['sales', 'automation'],
    roadmap: ['Sync CRM signals', 'Score leads using enrichment API', 'Auto-schedule calendar slots']
  },
  {
    id: 'ops-guardian',
    name: 'Ops Guardian',
    purpose: 'Monitor system health, auto-remediate incidents, and notify operators',
    code: `function monitorMetrics(metrics) {
  const anomalies = detectAnomalies(metrics);
  if (anomalies.length) {
    createIncident(anomalies);
  }
  return anomalies;
}`,
    tags: ['ops', 'monitoring'],
    roadmap: ['Connect observability streams', 'Detect anomalies hourly', 'Escalate unresolved incidents']
  },
  {
    id: 'creator-studio',
    name: 'Creator Studio',
    purpose: 'Draft social content variations and schedule multi-channel posts',
    code: `function generateContentBrief(idea) {
  return {
    hook: craftHook(idea),
    script: writeScript(idea),
    callToAction: suggestCTA(idea)
  };
}`,
    tags: ['marketing', 'content'],
    roadmap: ['Collect campaign goals', 'Draft copy and scripts', 'Publish to social calendar']
  }
];

const CLOUD_BOTS_PATH = 'bots';
const CLOUD_DNA_PATH = 'behavioralDNA';
const CLOUD_ACTIVITY_PATH = 'botActivity';
let syncBootstrapped = false;

export async function loadBotsPage() {
  try {
    await bootstrapRealtimeSync();
    populateTemplateOptions();
    await renderBotList();
    wireBotControls();
  } catch (error) {
    showToast(`Failed to load Bots: ${error.message}`);
    console.error('Bots Error:', error);
  }
}

function wireBotControls() {
  const createBtn = document.getElementById('create-bot');
  if (createBtn) createBtn.addEventListener('click', () => createBotFromInputs());
  const uploadInput = document.getElementById('upload-blueprint');
  if (uploadInput) uploadInput.addEventListener('change', uploadBlueprint);
}

function populateTemplateOptions() {
  const select = document.getElementById('bot-template');
  if (!select) return;
  select.innerHTML = '<option value="">Choose a template</option>';
  BOT_TEMPLATES.forEach(template => {
    const option = document.createElement('option');
    option.value = template.id;
    option.textContent = template.name;
    select.appendChild(option);
  });
  select.addEventListener('change', () => {
    const template = BOT_TEMPLATES.find(t => t.id === select.value);
    if (!template) return;
    const nameField = document.getElementById('bot-name');
    const purposeField = document.getElementById('bot-purpose');
    if (nameField && !nameField.value) nameField.value = template.name;
    if (purposeField) purposeField.value = template.purpose;
    showToast(`Loaded ${template.name} template`);
  });
}

async function createBotFromInputs() {
  const nameField = document.getElementById('bot-name');
  const purposeField = document.getElementById('bot-purpose');
  if (!nameField || !purposeField) return;
  const name = nameField.value.trim();
  const purpose = purposeField.value.trim();
  if (!name || !purpose) {
    showToast('Name and Purpose required');
    return;
  }
  const templateId = document.getElementById('bot-template')?.value || '';
  await createBotRecord({ name, purpose, templateId });
  nameField.value = '';
  purposeField.value = '';
  if (document.getElementById('bot-template')) document.getElementById('bot-template').value = '';
}

async function uploadBlueprint(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const blueprint = JSON.parse(text);
    const name = blueprint.name || blueprint.title || 'Imported Bot';
    const purpose = blueprint.purpose || blueprint.description || 'Imported bot blueprint';
    await createBotRecord({ name, purpose, templateId: blueprint.templateId || '' , overrides: blueprint });
    showToast('Blueprint imported and deployed');
  } catch (error) {
    showToast('Failed to import blueprint');
    console.error('Blueprint import error:', error);
  }
  event.target.value = '';
}

async function createBotRecord({ name, purpose, templateId, overrides }) {
  const template = BOT_TEMPLATES.find(t => t.id === templateId);
  const now = Date.now();
  const bot = {
    id: `${now}-${Math.random().toString(36).slice(2,8)}`,
    name,
    purpose,
    template: templateId || 'custom',
    creator: localStorage.getItem('currentUser') || 'guest',
    createdAt: now,
    updatedAt: now,
    status: 'idle',
    lastRun: null,
    runCount: 0,
    tags: template?.tags || deriveTags(purpose),
    roadmap: template?.roadmap || buildRoadmap(purpose),
    metrics: { successRate: 0, avgRuntime: 0, lastRuntime: 0 },
    blueprint: buildBlueprint(purpose, template?.code, overrides),
    code: overrides?.code || template?.code || `// ${purpose}`
  };

  await IDB.batchSet('bots', [bot]);
  await syncBotToCloud(bot, true);

  const dna = generateBehavioralDNA(bot.purpose, bot.code);
  dna.botId = bot.id;
  await IDB.batchSet('behavioral_dna', [dna]);
  await syncBotDNA(bot.id, dna);

  await recordBotActivity(bot.id, 'Created bot', { template: bot.template });
  logActivity(`Created bot ${bot.name}`);
  showToast(`Bot ${bot.name} created`);
  await renderBotList();
}

function deriveTags(purpose) {
  return purpose.split(' ').slice(0, 3).map(token => token.replace(/[^a-z0-9]/gi, '').toLowerCase()).filter(Boolean);
}

function buildRoadmap(purpose) {
  return [
    `Clarify objectives for ${purpose.toLowerCase()}`,
    `Draft core automation steps`,
    `Define guardrails and success metrics`
  ];
}

function buildBlueprint(purpose, templateCode, overrides) {
  return {
    intents: overrides?.intents || [purpose],
    guardrails: overrides?.guardrails || ['Respect privacy policies', 'Escalate unclear scenarios'],
    samplePrompts: overrides?.samplePrompts || [`You are focused on ${purpose.toLowerCase()}`],
    executionPlan: overrides?.executionPlan || [
      { phase: 'ingest', detail: 'Collect needed context and datasets' },
      { phase: 'plan', detail: 'Generate actionable response or task list' },
      { phase: 'review', detail: 'Score quality and push to activity log' }
    ],
    source: templateCode ? 'template' : 'custom'
  };
}

async function renderBotList() {
  const list = document.getElementById('bot-list');
  if (!list) return;
  const bots = await IDB.getAll('bots');
  list.innerHTML = '';
  if (!bots.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = '<p>No bots yet. Pick a template or import a blueprint to get started.</p>';
    list.appendChild(empty);
    return;
  }
  bots.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
  bots.forEach(bot => {
    const card = document.createElement('div');
    card.className = 'bot-item glassmorphic bot-card';
    card.innerHTML = `
      <header class="bot-card-header">
        <div>
          <h4>${bot.name}</h4>
          <p class="bot-purpose">${bot.purpose}</p>
        </div>
        <span class="bot-status bot-status-${bot.status || 'idle'}">${(bot.status || 'idle').toUpperCase()}</span>
      </header>
      <div class="bot-card-body">
        <div class="bot-meta">
          <span>Template: ${bot.template}</span>
          <span>Runs: ${bot.runCount || 0}</span>
          <span>Avg Runtime: ${bot.metrics?.avgRuntime || 0}ms</span>
          <span>Success: ${bot.metrics?.successRate || 0}%</span>
          <span>Updated: ${formatTimestamp(bot.updatedAt || bot.createdAt)}</span>
        </div>
        ${renderTags(bot.tags)}
        ${renderRoadmap(bot.roadmap)}
      </div>
      <footer class="bot-card-actions">
        <button data-id="${bot.id}" class="run-bot">Run</button>
        <button data-id="${bot.id}" class="simulate-bot">Simulate</button>
        <button data-id="${bot.id}" class="export-bot">Export</button>
        <button data-id="${bot.id}" class="duplicate-bot">Duplicate</button>
        <button data-id="${bot.id}" class="delete-bot danger">Delete</button>
      </footer>
    `;
    list.appendChild(card);
  });

  list.querySelectorAll('.run-bot').forEach(btn => btn.addEventListener('click', () => runBot(btn.dataset.id)));
  list.querySelectorAll('.simulate-bot').forEach(btn => btn.addEventListener('click', () => simulateBot(btn.dataset.id)));
  list.querySelectorAll('.export-bot').forEach(btn => btn.addEventListener('click', () => exportBot(btn.dataset.id)));
  list.querySelectorAll('.duplicate-bot').forEach(btn => btn.addEventListener('click', () => duplicateBot(btn.dataset.id)));
  list.querySelectorAll('.delete-bot').forEach(btn => btn.addEventListener('click', () => deleteBot(btn.dataset.id)));
}

function renderTags(tags = []) {
  if (!tags.length) return '';
  const chips = tags.map(tag => `<span class="bot-tag">${tag}</span>`).join('');
  return `<div class="bot-tags">${chips}</div>`;
}

function renderRoadmap(roadmap = []) {
  if (!roadmap.length) return '';
  const items = roadmap.slice(0, 3).map(step => `<li>${step}</li>`).join('');
  return `<div class="bot-roadmap"><h5>Roadmap</h5><ul>${items}</ul></div>`;
}

export async function createBotFromText() {
  const ideaField = document.getElementById('text-input');
  if (!ideaField) {
    showToast('Text input not found');
    return;
  }
  const idea = ideaField.value.trim();
  if (!idea) {
    showToast('Enter text to create bot');
    return;
  }
  await createBotRecord({ name: `${idea.split(' ')[0] || 'Idea'} Bot`, purpose: idea, templateId: 'creator-studio' });
  ideaField.value = '';
  showToast('Bot created from idea');
}

export async function runBot(botId) {
  const bot = await IDB.get('bots', botId);
  if (!bot) {
    showToast('Bot not found');
    return;
  }
  const start = performance.now();
  bot.status = 'running';
  bot.updatedAt = Date.now();
  await saveBot(bot);
  const duration = Math.round(200 + Math.random() * 800);
  const dna = await IDB.get('behavioral_dna', botId);
  const validation = dna ? await validateBotBehavior(bot, dna) : { valid: true, issues: [] };
  bot.lastRun = Date.now();
  bot.runCount = (bot.runCount || 0) + 1;
  bot.metrics = bot.metrics || {};
  bot.metrics.lastRuntime = Math.round(performance.now() - start + duration);
  bot.metrics.avgRuntime = Math.round(((bot.metrics.avgRuntime || duration) * (bot.runCount - 1) + bot.metrics.lastRuntime) / bot.runCount);
  if (validation.valid) {
    bot.metrics.successRate = Math.min(100, Math.round(((bot.metrics?.successRate || 90) * (bot.runCount - 1) + 100) / bot.runCount));
  } else {
    bot.metrics.successRate = Math.max(0, Math.round((bot.metrics?.successRate || 90) * 0.8));
  }
  bot.status = validation.valid ? 'idle' : 'flagged';
  await saveBot(bot);
  await recordBotActivity(bot.id, 'Executed bot', { duration: bot.metrics.lastRuntime, valid: validation.valid, issues: validation.issues });
  showToast(validation.valid ? `Bot ${bot.name} executed in ${bot.metrics.lastRuntime}ms` : `Bot ${bot.name} flagged: ${validation.issues.join(', ')}`);
  if (!validation.valid) logActivity(`Bot ${bot.name} flagged: ${validation.issues.join(', ')}`);
  await renderBotList();
}

async function simulateBot(botId) {
  const bot = await IDB.get('bots', botId);
  if (!bot) {
    showToast('Bot not found');
    return;
  }
  bot.status = 'active';
  bot.updatedAt = Date.now();
  const simulatedRuntime = Math.round(150 + Math.random() * 600);
  bot.metrics = bot.metrics || {};
  bot.metrics.simulatedRuntime = simulatedRuntime;
  bot.metrics.successForecast = Math.round(85 + Math.random() * 10);
  await saveBot(bot);
  await recordBotActivity(bot.id, 'Simulated run forecast', { runtime: simulatedRuntime, success: bot.metrics.successForecast });
  showToast(`Forecasted ${bot.name}: ${simulatedRuntime}ms runtime, ${bot.metrics.successForecast}% success`);
  bot.status = 'idle';
  await saveBot(bot);
  await renderBotList();
}

async function duplicateBot(botId) {
  const bot = await IDB.get('bots', botId);
  if (!bot) {
    showToast('Bot not found');
    return;
  }
  await createBotRecord({
    name: `${bot.name} Clone`,
    purpose: bot.purpose,
    templateId: bot.template,
    overrides: bot.blueprint
  });
  showToast('Bot duplicated');
}

async function exportBot(botId) {
  const bot = await IDB.get('bots', botId);
  if (!bot) {
    showToast('Bot not found');
    return;
  }
  const payload = { ...bot };
  const element = document.createElement('a');
  element.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  element.download = `${bot.name.replace(/\s+/g, '-').toLowerCase()}-blueprint.json`;
  element.click();
  URL.revokeObjectURL(element.href);
  await recordBotActivity(bot.id, 'Exported blueprint', {});
  showToast('Blueprint exported');
}

export async function deleteBot(botId) {
  await IDB.batchSet('bots', [{ id: botId, _delete: true }]);
  try { await remove(dbRef(`${CLOUD_BOTS_PATH}/${botId}`)); } catch (error) { console.warn('Failed to remove bot from cloud', error); }
  await IDB.batchSet('behavioral_dna', [{ botId, _delete: true }]);
  try { await remove(dbRef(`${CLOUD_DNA_PATH}/${botId}`)); } catch (error) { console.warn('Failed to remove DNA from cloud', error); }
  await recordBotActivity(botId, 'Deleted bot', {});
  logActivity('Deleted bot');
  showToast('Bot deleted');
  await renderBotList();
}

async function bootstrapRealtimeSync() {
  if (syncBootstrapped) return;
  syncBootstrapped = true;
  try {
    const snapshot = await get(dbRef(CLOUD_BOTS_PATH));
    if (snapshot.exists()) {
      const bots = Object.entries(snapshot.val()).map(([id, value]) => ({ ...value, id }));
      await IDB.batchSet('bots', bots);
    }
  } catch (error) {
    console.warn('Failed to bootstrap bots from cloud', error);
  }

  const botsRef = dbRef(CLOUD_BOTS_PATH);
  onChildAdded(botsRef, snapshot => upsertBot(snapshot));
  onChildChanged(botsRef, snapshot => upsertBot(snapshot));
  onChildRemoved(botsRef, snapshot => removeBotLocal(snapshot.key));

  const activityRef = dbRef(CLOUD_ACTIVITY_PATH);
  onChildAdded(activityRef, snapshot => {
    const entry = snapshot.val();
    if (!entry?.id) return;
    IDB.batchSet('tracking', [entry]).catch(err => console.warn('Activity sync failed', err));
  });
}

function upsertBot(snapshot) {
  const bot = snapshot.val();
  if (!bot) return;
  bot.id = snapshot.key;
  IDB.batchSet('bots', [bot]).then(renderBotList).catch(err => console.warn('Bot sync failed', err));
}

function removeBotLocal(botId) {
  if (!botId) return;
  IDB.batchSet('bots', [{ id: botId, _delete: true }]).then(renderBotList).catch(err => console.warn('Bot removal sync failed', err));
}

async function saveBot(bot) {
  await IDB.batchSet('bots', [bot]);
  try { await update(dbRef(`${CLOUD_BOTS_PATH}/${bot.id}`), bot); } catch (error) { console.warn('Failed to sync bot update', error); }
}

async function syncBotToCloud(bot, isNew) {
  try {
    const ref = dbRef(`${CLOUD_BOTS_PATH}/${bot.id}`);
    if (isNew) {
      await set(ref, bot);
    } else {
      await update(ref, bot);
    }
  } catch (error) {
    console.warn('Bot cloud sync failed', error);
  }
}

async function syncBotDNA(botId, dna) {
  try {
    await set(dbRef(`${CLOUD_DNA_PATH}/${botId}`), dna);
  } catch (error) {
    console.warn('Bot DNA sync failed', error);
  }
}

async function recordBotActivity(botId, title, details) {
  const entry = {
    id: `bot-${botId}-${Date.now()}`,
    botId,
    title,
    details,
    timestamp: Date.now(),
    type: 'bot',
    user: localStorage.getItem('currentUser') || 'system'
  };
  await IDB.batchSet('tracking', [entry]);
  try { await set(dbRef(`${CLOUD_ACTIVITY_PATH}/${entry.id}`), entry); } catch (error) { console.warn('Failed to sync bot activity', error); }
}

function formatTimestamp(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export async function getBotInsights() {
  const bots = await IDB.getAll('bots');
  const now = Date.now();
  const statuses = {};
  const categories = {};
  let cumulativeRuntime = 0;
  bots.forEach(bot => {
    const status = bot.status || 'idle';
    const category = bot.template || 'custom';
    statuses[status] = (statuses[status] || 0) + 1;
    categories[category] = (categories[category] || 0) + 1;
    cumulativeRuntime += bot.metrics?.avgRuntime || 0;
  });
  return {
    total: bots.length,
    active24h: bots.filter(bot => bot.lastRun && now - bot.lastRun < 86400000).length,
    statuses,
    categories,
    avgRuntime: bots.length ? Math.round(cumulativeRuntime / bots.length) : 0,
    recent: bots.slice().sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt)).slice(0, 4)
  };
}

export async function getBotActivity(limit = 8) {
  const entries = await IDB.getAll('tracking');
  return entries
    .filter(entry => entry.type === 'bot')
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, limit);
}
