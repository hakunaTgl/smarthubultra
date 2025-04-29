import { IDB, showToast, speak, logActivity } from './utils.js';
import { generateBehavioralDNA, validateBotBehavior } from './behavioralDNA.js';
import { setupCollaborativeMode } from './collab.js';

export async function loadEditor() {
  try {
    const editor = document.getElementById('code-editor');
    const bot = JSON.parse(localStorage.getItem('editingBot') || '{}');
    editor.value = bot.code || 'return async () => "Bot initialized";';

    document.getElementById('run-code').addEventListener('click', async () => {
      const code = editor.value;
      try {
        const func = new Function('return ' + code)();
        const result = await func();
        document.getElementById('code-output').textContent = `Output: ${result}`;
        showToast('Code executed successfully');
        logActivity('Ran code in editor');
      } catch (error) {
        showToast(`Code Execution Failed: ${error.message}`);
      }
    });

    document.getElementById('save-version').addEventListener('click', async () => {
      const code = editor.value;
      const version = {
        botId: bot.id,
        code,
        timestamp: Date.now(),
        creator: localStorage.getItem('currentUser')
      };
      await IDB.batchSet('versions', [version]);
      firebase.database().ref('versions/' + bot.id + '/' + version.timestamp).set(version);
      bot.code = code;
      const dna = generateBehavioralDNA(bot.purpose, bot.code);
      await IDB.batchSet('bots', [bot]);
      await IDB.batchSet('behavioral_dna', [dna]);
      firebase.database().ref('bots/' + bot.id).set(bot);
      firebase.database().ref('behavioral_dna/' + dna.botId).set(dna);
      await setupCollaborativeMode(bot);
      showToast('Version saved!');
      logActivity(`Saved version for bot: ${bot.name}`);
      loadVersionHistory(bot.id);
    });

    document.getElementById('share-btn').addEventListener('click', () => {
      const code = editor.value;
      const url = `${window.location.origin}/share?code=${encodeURIComponent(code)}`;
      navigator.clipboard.writeText(url);
      showToast('Shareable URL copied to clipboard!');
      logActivity('Shared code from editor');
    });

    document.getElementById('generate-qr').addEventListener('click', () => {
      const code = editor.value;
      const url = `${window.location.origin}/share?code=${encodeURIComponent(code)}`;
      const qrDiv = document.getElementById('qr-code');
      qrDiv.innerHTML = '';
      QRCode.toCanvas(url, { width: 100 }, (err, canvas) => {
        if (err) throw err;
        qrDiv.appendChild(canvas);
      });
      showToast('QR code generated!');
      logActivity('Generated QR code for code');
    });

    loadVersionHistory(bot.id);
    speak('Welcome to the Editor! Edit and save your bot code.');
  } catch (error) {
    showToast(`Failed to load Editor: ${error.message}`);
    console.error('Editor Error:', error);
  }
}

async function loadVersionHistory(botId) {
  const historyDiv = document.getElementById('version-history');
  historyDiv.innerHTML = '';
  const versions = await IDB.getAll('versions');
  versions.filter(v => v.botId === botId).forEach(v => {
    const div = document.createElement('div');
    div.className = 'version-item';
    div.textContent = `Version from ${new Date(v.timestamp).toLocaleString()}`;
    historyDiv.appendChild(div);
  });
}
