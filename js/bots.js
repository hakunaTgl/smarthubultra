import { IDB, showToast, speak, logActivity } from './utils.js';
import { generateBehavioralDNA, validateBotBehavior } from './behavioralDNA.js';
import { setupCollaborativeMode } from './collab.js';

export async function loadBotsPage() {
  const botList = document.getElementById('bot-list');
  botList.innerHTML = '';
  const bots = await IDB.getAll('bots');
  const user = localStorage.getItem('currentUser');
  bots.filter(b => b.creator === user || b.collaborators?.includes(user)).forEach(bot => {
    const div = document.createElement('div');
    div.className = 'bot-item';
    div.innerHTML = `
      <p><b>${bot.name}</b> (${bot.purpose})</p>
      <button class="edit-bot btn blue-glow" data-id="${bot.id}">Edit</button>
      <button class="run-bot btn green-glow" data-id="${bot.id}">Run</button>
      <button class="delete-bot btn red-glow" data-id="${bot.id}">Delete</button>
    `;
    botList.appendChild(div);
  });

  document.getElementById('use-wizard').addEventListener('change', () => {
    document.getElementById('creation-wizard').classList.toggle('hidden');
  });

  document.getElementById('submit-wizard').addEventListener('click', createBotFromWizard);
  document.getElementById('file-input').addEventListener('change', handleFileUpload);
  document.getElementById('text-input-btn').addEventListener('click', createBotFromText);
  document.getElementById('voice-input-btn').addEventListener('click', () => {
    speak('Voice input not implemented yet.');
    showToast('Voice input not implemented yet.');
  });
  document.getElementById('fusion-btn').addEventListener('click', fuseBots);
  document.querySelectorAll('.edit-bot').forEach(btn => {
    btn.addEventListener('click', () => editBot(btn.dataset.id));
  });
  document.querySelectorAll('.run-bot').forEach(btn => {
    btn.addEventListener('click', () => runBot(btn.dataset.id));
  });
  document.querySelectorAll('.delete-bot').forEach(btn => {
    btn.addEventListener('click', () => deleteBot(btn.dataset.id));
  });

  loadMarketplace();
}

async function createBotFromWizard() {
  const description = document.getElementById('bot-description').value;
  const blueprint = document.getElementById('bot-blueprint').files[0];
  if (!description && !blueprint) {
    showToast('Invalid Bot Configuration: Description or blueprint required');
    return;
  }
  try {
    let code = 'return async () => "Bot initialized";';
    if (blueprint) {
      const text = await blueprint.text();
      code = JSON.parse(text).code || code;
    }
    const bot = {
      id: Date.now().toString(),
      name: description.split(' ')[0] || 'NewBot',
      purpose: description,
      code,
      creator: localStorage.getItem('currentUser'),
      createdAt: Date.now()
    };
    const dna = generateBehavioralDNA(bot.purpose, bot.code);
    await IDB.batchSet('bots', [bot]);
    await IDB.batchSet('behavioral_dna', [dna]);
    firebase.database().ref('bots/' + bot.id).set(bot);
    firebase.database().ref('behavioral_dna/' + dna.botId).set(dna);
    await setupCollaborativeMode(bot);
    showToast(`Bot ${bot.name} created!`);
    logActivity(`Created bot: ${bot.name}`);
    loadBotsPage();
  } catch (error) {
    showToast(`Invalid Bot Configuration: ${error.message}`);
  }
}

async function handleFileUpload(e) {
  const files = e.target.files;
  for (const file of files) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const bot = {
        id: Date.now().toString(),
        name: data.name || 'ImportedBot',
        purpose: data.purpose || 'General',
        code: data.code || 'return async () => "Bot initialized";',
        creator: localStorage.getItem('currentUser'),
        createdAt: Date.now()
      };
      const dna = generateBehavioralDNA(bot.purpose, bot.code);
      await IDB.batchSet('bots', [bot]);
      await IDB.batchSet('behavioral_dna', [dna]);
      firebase.database().ref('bots/' + bot.id).set(bot);
      firebase.database().ref('behavioral_dna/' + dna.botId).set(dna);
      await setupCollaborativeMode(bot);
      showToast(`Bot ${bot.name} imported!`);
      logActivity(`Imported bot: ${bot.name}`);
    } catch (error) {
      showToast(`Invalid Bot Configuration: ${error.message}`);
    }
  }
  loadBotsPage();
}

async function createBotFromText() {
  const idea = document.getElementById('text-input').value;
  if (!idea) {
    showToast('Invalid Bot Configuration: Idea required');
    return;
  }
  const bot = {
    id: Date.now().toString(),
    name: idea.split(' ')[0] || 'TextBot',
    purpose: idea,
    code: 'return async () => "Bot initialized";',
    creator: localStorage.getItem('currentUser'),
    createdAt: Date.now()
  };
  const dna = generateBehavioralDNA(bot.purpose, bot.code);
  await IDB.batchSet('bots', [bot]);
  await IDB.batchSet('behavioral_dna', [dna]);
  firebase.database().ref('bots/' + bot.id).set(bot);
  firebase.database().ref('behavioral_dna/' + dna.botId).set(dna);
  await setupCollaborativeMode(bot);
  showToast(`Bot ${bot.name} created from text!`);
  logActivity(`Created bot from text: ${bot.name}`);
  loadBotsPage();
}

async function editBot(id) {
  const bot = await IDB.get('bots', id);
  localStorage.setItem('editingBot', JSON.stringify(bot));
  document.getElementById('bots-modal').classList.add('hidden');
  document.getElementById('editor-modal').classList.remove('hidden');
  loadEditor();
}

async function runBot(id) {
  const bot = await IDB.get('bots', id);
  const dna = await IDB.get('behavioral_dna', id);
  if (!dna) {
    showToast('Invalid Bot Configuration: No Behavioral DNA found');
    return;
  }
  const validation = await validateBotBehavior(bot, dna);
  if (!validation.valid) {
    showToast(`Rogue Behavior Detected: ${validation.issues.join(', ')}`);
    return;
  }
  try {
    const func = new Function('return ' + bot.code)();
    const result = await func();
    showToast(`Bot ${bot.name} executed: ${result}`);
    logActivity(`Ran bot: ${bot.name}`);
  } catch (error) {
    showToast(`Bot Execution Failed: ${error.message}`);
  }
}

async function deleteBot(id) {
  await IDB.batchSet('bots', [{ id, _delete: true }]);
  await IDB.batchSet('behavioral_dna', [{ botId: id, _delete: true }]);
  firebase.database().ref('bots/' + id).remove();
  firebase.database().ref('behavioral_dna/' + id).remove();
  showToast('Bot deleted!');
  logActivity(`Deleted bot: ${id}`);
  loadBotsPage();
}

async function fuseBots() {
  const bots = await IDB.getAll('bots');
  if (bots.length < 2) {
    showToast('Invalid Bot Configuration: At least two bots required for fusion');
    return;
  }
  const bot1 = bots[0];
  const bot2 = bots[1];
  const fusedBot = {
    id: Date.now().toString(),
    name: `Fused_${bot1.name}_${bot2.name}`,
    purpose: `${bot1.purpose} & ${bot2.purpose}`,
    code: `return async () => { ${bot1.code}; ${bot2.code}; return "Fused bot executed"; }`,
    creator: localStorage.getItem('currentUser'),
    createdAt: Date.now()
  };
  const dna = generateBehavioralDNA(fusedBot.purpose, fusedBot.code);
  await IDB.batchSet('bots', [fusedBot]);
  await IDB.batchSet('behavioral_dna', [dna]);
  firebase.database().ref('bots/' + fusedBot.id).set(fusedBot);
  firebase.database().ref('behavioral_dna/' + dna.botId).set(dna);
  showToast(`Fused bot ${fusedBot.name} created!`);
  logActivity(`Fused bots: ${bot1.name} & ${bot2.name}`);
  loadBotsPage();
}

async function loadMarketplace() {
  const marketplace = document.getElementById('marketplace');
  const featured = document.getElementById('featured-bots');
  marketplace.innerHTML = '';
  featured.innerHTML = '';
  const bots = await IDB.getAll('bots');
  bots.forEach(bot => {
    const div = document.createElement('div');
    div.className = bot.featured ? 'featured-bot' : 'bot-item';
    div.innerHTML = `<p>${bot.name} by ${bot.creator}</p>`;
    if (bot.featured) featured.appendChild(div);
    else marketplace.appendChild(div);
  });
}
