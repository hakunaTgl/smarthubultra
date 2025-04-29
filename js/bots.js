import { IDB, showToast, speak, logActivity } from './utils.js';
import { generateBehavioralDNA, validateBotBehavior } from './behavioralDNA.js';
import { setupCollaborativeMode } from './collab.js';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, update, remove } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAPPllpKiFOcjqxnuk2tRvithFYKSzkQAc",
  authDomain: "smarthubultra.firebaseapp.com",
  databaseURL: "https://smarthubultra-default-rtdb.firebaseio.com",
  projectId: "smarthubultra",
  storageBucket: "smarthubultra.firebasestorage.app",
  messagingSenderId: "12039705608",
  appId: "1:12039705608:web:f1a4383b245275eaa26dbd",
  measurementId: "G-V24P3DHL9M"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export async function loadBotsPage() {
  try {
    const botList = document.getElementById('bot-list');
    botList.innerHTML = '';
    const bots = await IDB.getAll('bots');
    const user = localStorage.getItem('currentUser');
    bots.filter(b => b.creator === user || b.collaborators?.includes(user)).forEach(bot => {
      const div = document.createElement('div');
      div.className = 'bot-item';
      div.innerHTML = `<p>${bot.name}</p><button onclick="editBot('${bot.id}')">Edit</button><button onclick="runBot('${bot.id}')">Run</button><button onclick="deleteBot('${bot.id}')">Delete</button>`;
      botList.appendChild(div);
    });

    document.getElementById('create-bot').addEventListener('click', async () => {
      const name = document.getElementById('bot-name').value;
      const purpose = document.getElementById('bot-purpose').value;
      const template = document.getElementById('bot-template').value;
      if (!name || !purpose) {
        showToast('Invalid Bot Configuration: Name and purpose required');
        return;
      }
      const bot = {
        id: Date.now().toString(),
        name,
        purpose,
        code: template || 'return async () => "Bot initialized";',
        creator: user,
        createdAt: Date.now(),
        collaborators: []
      };
      const dna = generateBehavioralDNA(bot.purpose, bot.code);
      await IDB.batchSet('bots', [bot]);
      await IDB.batchSet('behavioral_dna', [dna]);
      await set(ref(database, 'bots/' + bot.id), bot);
      await set(ref(database, 'behavioral_dna/' + dna.botId), dna);
      await setupCollaborativeMode(bot);
      showToast(`Bot ${name} created!`);
      logActivity(`Created bot: ${name}`);
      loadBotsPage();
    });

    document.getElementById('upload-blueprint').addEventListener('change', async e => {
      const file = e.target.files[0];
      const text = await file.text();
      try {
        const blueprint = JSON.parse(text);
        const bot = {
          id: Date.now().toString(),
          name: blueprint.name,
          purpose: blueprint.purpose,
          code: blueprint.code,
          creator: user,
          createdAt: Date.now(),
          collaborators: []
        };
        const dna = generateBehavioralDNA(bot.purpose, bot.code);
        await IDB.batchSet('bots', [bot]);
        await IDB.batchSet('behavioral_dna', [dna]);
        await set(ref(database, 'bots/' + bot.id), bot);
        await set(ref(database, 'behavioral_dna/' + dna.botId), dna);
        showToast(`Blueprint ${bot.name} uploaded!`);
        logActivity(`Uploaded bot blueprint: ${bot.name}`);
        loadBotsPage();
      } catch (error) {
        showToast(`Invalid blueprint format: ${error.message}`);
      }
    });

    loadBotTemplates();
    loadMarketplace();
    speak('Welcome to the Bots page! Create and manage your bots.');
  } catch (error) {
    showToast(`Failed to load Bots page: ${error.message}`);
    console.error('Bots Error:', error);
  }
}

export async function createBotFromText() {
  try {
    const idea = document.getElementById('text-input').value;
    if (!idea) {
      showToast('Enter a bot idea');
      return;
    }
    const user = localStorage.getItem('currentUser');
    const bot = {
      id: Date.now().toString(),
      name: `Bot-${Date.now()}`,
      purpose: idea,
      code: 'return async () => "Bot initialized";',
      creator: user,
      createdAt: Date.now(),
      collaborators: []
    };
    const dna = generateBehavioralDNA(bot.purpose, bot.code);
    await IDB.batchSet('bots', [bot]);
    await IDB.batchSet('behavioral_dna', [dna]);
    await set(ref(database, 'bots/' + bot.id), bot);
    await set(ref(database, 'behavioral_dna/' + dna.botId), dna);
    await setupCollaborativeMode(bot);
    showToast(`Bot created from idea: ${idea}`);
    logActivity(`Created bot from text: ${idea}`);
    loadBotsPage();
  } catch (error) {
    showToast(`Failed to create bot: ${error.message}`);
  }
}

export async function editBot(botId) {
  try {
    const bot = await IDB.get('bots', botId);
    localStorage.setItem('editingBot', JSON.stringify(bot));
    document.getElementById('bots-modal').classList.add('hidden');
    document.getElementById('editor-modal').classList.remove('hidden');
    logActivity(`Editing bot: ${bot.name}`);
  } catch (error) {
    showToast(`Failed to edit bot: ${error.message}`);
  }
}

export async function runBot(botId) {
  try {
    const bot = await IDB.get('bots', botId);
    const dna = await IDB.get('behavioral_dna', botId);
    const validation = await validateBotBehavior(bot, dna);
    if (!validation.valid) {
      showToast(`Rogue Behavior Detected: ${validation.issues.join(', ')}`);
      return;
    }
    const func = new Function('return ' + bot.code)();
    const result = await func();
    showToast(`Bot ${bot.name} executed: ${result}`);
    bot.runtime = Math.random() * 1000;
    bot.lastRun = Date.now();
    await IDB.batchSet('bots', [bot]);
    await update(ref(database, 'bots/' + botId), { runtime: bot.runtime, lastRun: bot.lastRun });
    logActivity(`Ran bot: ${bot.name}`);
  } catch (error) {
    showToast(`Bot execution failed: ${error.message}`);
  }
}

export async function deleteBot(botId) {
  try {
    await IDB.batchSet('bots', [{ id: botId, _delete: true }]);
    await IDB.batchSet('behavioral_dna', [{ botId, _delete: true }]);
    await remove(ref(database, 'bots/' + botId));
    await remove(ref(database, 'behavioral_dna/' + botId));
    showToast('Bot deleted');
    logActivity(`Deleted bot: ${botId}`);
    loadBotsPage();
  } catch (error) {
    showToast(`Failed to delete bot: ${error.message}`);
  }
}

async function loadBotTemplates() {
  const templateSelect = document.getElementById('bot-template');
  templateSelect.innerHTML = '<option value="">Select Template</option>';
  const templates = [
    { name: 'Basic Bot', code: 'return async () => "Hello from bot!";' },
    { name: 'API Bot', code: 'return async () => { const res = await fetch("https://api.example.com"); return res.json(); };' },
    { name: 'Chat Bot', code: 'return async (input) => `You said: ${input}`;' }
  ];
  templates.forEach(t => {
    const option = document.createElement('option');
    option.value = t.code;
    option.textContent = t.name;
    templateSelect.appendChild(option);
  });
}

async function loadMarketplace() {
  const featured = document.getElementById('featured-bots');
  featured.innerHTML = '';
  const marketplace = document.getElementById('marketplace');
  marketplace.innerHTML = '';
  const bots = await IDB.getAll('bots');
  bots.slice(0, 3).forEach(bot => {
    const div = document.createElement('div');
    div.className = 'featured-bot';
    div.innerHTML = `<p>${bot.name}: ${bot.purpose}</p>`;
    featured.appendChild(div);
  });
  bots.forEach(bot => {
    const div = document.createElement('div');
    div.className = 'bot-item';
    div.innerHTML = `<p>${bot.name} by ${bot.creator}</p>`;
    marketplace.appendChild(div);
  });
}
