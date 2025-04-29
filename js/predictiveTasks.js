import { IDB, showToast, logActivity } from './utils.js';
import { validateBotBehavior } from './behavioralDNA.js';

export async function runPredictiveTasks() {
  try {
    const bots = await IDB.getAll('bots');
    for (const bot of bots) {
      const dna = await IDB.get('behavioral_dna', bot.id);
      if (!dna) continue;
      const validation = await validateBotBehavior(bot, dna);
      if (!validation.valid) {
        showToast(`Predictive Task: Rogue Behavior Detected in ${bot.name}: ${validation.issues.join(', ')}`);
        logActivity(`Predictive task detected issue in bot: ${bot.name}`);
      }
    }
    showToast('Predictive tasks completed');
    logActivity('Ran predictive tasks');
  } catch (error) {
    showToast(`Predictive Tasks Failed: ${error.message}`);
    console.error('Predictive Tasks Error:', error);
  }
}
