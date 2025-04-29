import { IDB, showToast, speak, logActivity } from './utils.js';
import { validateBotBehavior } from './behavioralDNA.js';

export async function loadPlayground() {
  try {
    const playground = document.getElementById('bot-playground');
    playground.innerHTML = '';
    const bots = await IDB.getAll('bots');
    const user = localStorage.getItem('currentUser');
    bots.filter(b => b.creator === user || b.collaborators?.includes(user)).forEach(bot => {
      const div = document.createElement('div');
      div.className = 'bot-item';
      div.innerHTML = `<p>${bot.name}</p>`;
      playground.appendChild(div);
    });

    const opponentSelect = document.getElementById('opponent-bot');
    opponentSelect.innerHTML = '<option value="">Select opponent</option>';
    bots.forEach(bot => {
      const option = document.createElement('option');
      option.value = bot.id;
      option.textContent = bot.name;
      opponentSelect.appendChild(option);
    });

    document.getElementById('test-bot').addEventListener('click', async () => {
      const input = document.getElementById('test-input').value;
      const botId = bots[0]?.id; // For demo, use first bot
      if (!botId) {
        showToast('No bots available to test');
        return;
      }
      const bot = await IDB.get('bots', botId);
      const dna = await IDB.get('behavioral_dna', botId);
      const validation = await validateBotBehavior(bot, dna);
      if (!validation.valid) {
        document.getElementById('rogue-logs').innerHTML += `<p class="dna-warning">Rogue Behavior Detected: ${validation.issues.join(', ')}</p>`;
        showToast(`Rogue Behavior Detected: ${validation.issues.join(', ')}`);
        return;
      }
      const func = new Function('return ' + bot.code)();
      const result = await func(input);
      document.getElementById('test-logs').innerHTML = `<p>Test Result: ${result}</p>`;
      const sentiment = analyzeSentiment(result);
      document.getElementById('sentiment-analysis').innerHTML = `<p>Sentiment: <span class="${sentiment.positive ? 'sentiment-positive' : 'sentiment-negative'}">${sentiment.score}</span></p>`;
      document.getElementById('sentiment-analysis').classList.remove('hidden');
      showToast('Bot tested successfully');
      logActivity(`Tested bot: ${bot.name}`);
    });

    document.getElementById('start-battle').addEventListener('click', async () => {
      const opponentId = opponentSelect.value;
      if (!opponentId) {
        showToast('Select an opponent bot');
        return;
      }
      const bot1 = bots[0];
      const bot2 = await IDB.get('bots', opponentId);
      const result = await simulateBattle(bot1, bot2);
      document.getElementById('battle-results').innerHTML = `<div class="battle-result">${result}</div>`;
      showToast('Bot battle completed');
      logActivity(`Started bot battle: ${bot1.name} vs ${bot2.name}`);
    });

    speak('Welcome to the Bot Playground! Test and battle your bots.');
  } catch (error) {
    showToast(`Failed to load Playground: ${error.message}`);
    console.error('Playground Error:', error);
  }
}

function analyzeSentiment(text) {
  // Simulate sentiment analysis
  return { score: text.includes('error') ? 'Negative' : 'Positive', positive: !text.includes('error') };
}

async function simulateBattle(bot1, bot2) {
  // Simulate bot battle
  return `${bot1.name} wins with superior logic!`;
}
