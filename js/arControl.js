import { showToast, speak, logActivity } from './utils.js';
import { runBot, deleteBot } from './bots.js';
import { validateBotBehavior } from './behavioralDNA.js';
import { IDB } from './utils.js';

export async function setupARControlMode() {
  try {
    document.getElementById('ar-run-bot').addEventListener('click', async () => {
      const botId = (await IDB.getAll('bots'))[0]?.id; // Demo: first bot
      if (!botId) {
        showToast('No bots available');
        return;
      }
      await runBot(botId);
      showToast('Bot running in AR mode');
      logActivity('Ran bot in AR mode');
    });

    document.getElementById('ar-stop-bot').addEventListener('click', async () => {
      const botId = (await IDB.getAll('bots'))[0]?.id;
      if (!botId) {
        showToast('No bots available');
        return;
      }
      await deleteBot(botId);
      showToast('Bot stopped in AR mode');
      logActivity('Stopped bot in AR mode');
    });

    document.getElementById('ar-dna-check').addEventListener('click', async () => {
      const botId = (await IDB.getAll('bots'))[0]?.id;
      if (!botId) {
        showToast('No bots available');
        return;
      }
      const bot = await IDB.get('bots', botId);
      const dna = await IDB.get('behavioral_dna', botId);
      const validation = await validateBotBehavior(bot, dna);
      showToast(validation.valid ? 'Behavioral DNA validated' : `Rogue Behavior Detected: ${validation.issues.join(', ')}`);
      logActivity('Checked Behavioral DNA in AR mode');
    });

    const panel = document.getElementById('ar-control-panel');
    let isDragging = false;
    let offsetX, offsetY;

    panel.addEventListener('mousedown', e => {
      isDragging = true;
      offsetX = e.offsetX;
      offsetY = e.offsetY;
    });

    document.addEventListener('mousemove', e => {
      if (isDragging) {
        panel.style.left = `${e.clientX - offsetX}px`;
        panel.style.top = `${e.clientY - offsetY}px`;
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });

    speak('AR Control Mode ready! Use the control panel to manage bots.');
  } catch (error) {
    showToast(`Failed to setup AR Control Mode: ${error.message}`);
    console.error('AR Control Error:', error);
  }
}
