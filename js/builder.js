import { IDB, showToast, speak, logActivity } from './utils.js';
import { generateBehavioralDNA } from './behavioralDNA.js';
import { setupCollaborativeMode } from './collab.js';

export function setupBotBuilder() {
  try {
    const workspace = document.getElementById('builder-workspace');
    workspace.innerHTML = '';
    const components = document.querySelectorAll('.component');
    components.forEach(comp => {
      comp.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', e.target.dataset.type);
      });
    });

    workspace.addEventListener('dragover', e => {
      e.preventDefault();
    });

    workspace.addEventListener('drop', e => {
      e.preventDefault();
      const type = e.dataTransfer.getData('text/plain');
      const node = document.createElement('div');
      node.className = 'node glassmorphic';
      node.textContent = type.charAt(0).toUpperCase() + type.slice(1);
      node.dataset.type = type;
      workspace.appendChild(node);
      logActivity(`Added ${type} component to bot builder`);
    });

    document.getElementById('build-bot').addEventListener('click', async () => {
      const nodes = workspace.querySelectorAll('.node');
      if (!nodes.length) {
        showToast('No components added to build');
        return;
      }
      const bot = {
        id: Date.now().toString(),
        name: 'VisualBot',
        purpose: 'Built from visual components',
        code: generateCodeFromNodes(nodes),
        creator: localStorage.getItem('currentUser'),
        createdAt: Date.now(),
        collaborators: []
      };
      const dna = generateBehavioralDNA(bot.purpose, bot.code);
      await IDB.batchSet('bots', [bot]);
      await IDB.batchSet('behavioral_dna', [dna]);
      firebase.database().ref('bots/' + bot.id).set(bot);
      firebase.database().ref('behavioral_dna/' + dna.botId).set(dna);
      await setupCollaborativeMode(bot);
      showToast(`Bot ${bot.name} built successfully!`);
      logActivity(`Built bot: ${bot.name}`);
    });

    speak('Welcome to the Bot Builder! Drag components to create your bot.');
  } catch (error) {
    showToast(`Failed to setup Bot Builder: ${error.message}`);
    console.error('Bot Builder Error:', error);
  }
}

function generateCodeFromNodes(nodes) {
  let code = 'return async () => {';
  nodes.forEach(node => {
    const type = node.dataset.type;
    if (type === 'action') code += 'console.log("Performing action");';
    else if (type === 'condition') code += 'if (true) { console.log("Condition met"); }';
    else if (type === 'api') code += 'await fetch("https://api.example.com");';
    else if (type === 'meme') code += 'console.log("Fetching meme");';
    else if (type === 'image') code += 'console.log("Fetching image");';
  });
  code += 'return "Bot executed"; };';
  return code;
}
