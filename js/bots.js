import { IDB, showToast, logActivity } from './utils.js';

export async function loadBotsPage() {
  try {
    await renderBotList();

    document.getElementById('create-bot').addEventListener('click', createBot);
    document.getElementById('upload-blueprint').addEventListener('change', uploadBlueprint);
  } catch (error) {
    showToast(`Failed to load Bots: ${error.message}`);
    console.error('Bots Error:', error);
  }
}

async function createBot() {
  const name = document.getElementById('bot-name').value.trim();
  const purpose = document.getElementById('bot-purpose').value.trim();
  if (!name || !purpose) {
    showToast('Name and Purpose required');
    return;
  }
  const bot = {
    id: Date.now().toString(),
    name,
    purpose,
    code: `// ${purpose}`,
    creator: localStorage.getItem('currentUser'),
    createdAt: Date.now()
  };
  await IDB.batchSet('bots', [bot]);
  firebase.database().ref('bots/' + bot.id).set(bot);
  showToast(`Bot ${name} created`);
  logActivity(`Created bot ${name}`);
  await renderBotList();
}

async function uploadBlueprint(e) {
  const file = e.target.files[0];
  if (!file) return;
  const text = await file.text();
  const blueprint = JSON.parse(text);
  blueprint.id = Date.now().toString();
  await IDB.batchSet('bots', [blueprint]);
  firebase.database().ref('bots/' + blueprint.id).set(blueprint);
  showToast('Blueprint uploaded');
  logActivity('Uploaded bot blueprint');
  await renderBotList();
}

async function renderBotList() {
  const list = document.getElementById('bot-list');
  list.innerHTML = '';
  const bots = await IDB.getAll('bots');
  bots.forEach(bot => {
    const div = document.createElement('div');
    div.className = 'bot-item glassmorphic';
    div.innerHTML = `<span>${bot.name}</span>
      <button data-id="${bot.id}" class="run-bot">Run</button>
      <button data-id="${bot.id}" class="delete-bot">Delete</button>`;
    list.appendChild(div);
  });
  list.querySelectorAll('.run-bot').forEach(btn => btn.addEventListener('click', () => runBot(btn.dataset.id)));
  list.querySelectorAll('.delete-bot').forEach(btn => btn.addEventListener('click', () => deleteBot(btn.dataset.id)));
}

export async function createBotFromText() {
  const idea = document.getElementById('text-input').value.trim();
  if (!idea) {
    showToast('Enter text to create bot');
    return;
  }
  const bot = {
    id: Date.now().toString(),
    name: 'VoiceBot',
    purpose: idea,
    code: `// Bot created from text: ${idea}`,
    creator: localStorage.getItem('currentUser'),
    createdAt: Date.now()
  };
  await IDB.batchSet('bots', [bot]);
  firebase.database().ref('bots/' + bot.id).set(bot);
  showToast('Bot created from text');
  logActivity('Created bot from text');
  await renderBotList();
}

export async function runBot(botId) {
  const bot = await IDB.get('bots', botId);
  if (!bot) {
    showToast('Bot not found');
    return;
  }
  bot.lastRun = Date.now();
  await IDB.batchSet('bots', [bot]);
  firebase.database().ref('bots/' + bot.id).update({ lastRun: bot.lastRun });
  showToast(`Bot ${bot.name} executed`);
  logActivity(`Ran bot ${bot.name}`);
}

export async function deleteBot(botId) {
  await IDB.batchSet('bots', [{ id: botId, _delete: true }]);
  firebase.database().ref('bots/' + botId).remove();
  showToast('Bot deleted');
  logActivity('Deleted bot');
  await renderBotList();
}
