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

