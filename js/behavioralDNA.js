import { showToast } from './utils.js';

export function generateBehavioralDNA(purpose, code) {
  try {
    const dna = {
      botId: Date.now().toString(),
      purpose,
      codeHash: hashCode(code),
      behaviorProfile: {
        intent: purpose.split(' ')[0] || 'general',
        allowedActions: ['execute', 'log'],
        restrictedActions: ['delete', 'modify'],
        maxRuntime: 5000
      },
      createdAt: Date.now()
    };
    return dna;
  } catch (error) {
    showToast(`Failed to generate Behavioral DNA: ${error.message}`);
    throw error;
  }
}

export async function validateBotBehavior(bot, dna) {
  try {
    const currentHash = hashCode(bot.code);
    if (currentHash !== dna.codeHash) {
      return { valid: false, issues: ['Code tampering detected'] };
    }
    if (bot.runtime > dna.behaviorProfile.maxRuntime) {
      return { valid: false, issues: ['Excessive runtime detected'] };
    }
    return { valid: true, issues: [] };
  } catch (error) {
    showToast(`Failed to validate Behavioral DNA: ${error.message}`);
    return { valid: false, issues: [error.message] };
  }
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
  }
  return hash.toString();
}
