import { showToast, speak, logActivity } from './utils.js';
import { createBotFromText } from './bots.js';

export async function loadVoiceCommand() {
  try {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    document.getElementById('start-voice').addEventListener('click', () => {
      recognition.start();
      showToast('Listening for voice command...');
      logActivity('Started voice command');
    });

    recognition.onresult = async event => {
      const transcript = event.results[0][0].transcript;
      document.getElementById('voice-output').textContent = transcript;
      if (transcript.toLowerCase().includes('create bot')) {
        const idea = transcript.replace(/create bot/i, '').trim();
        document.getElementById('text-input').value = idea;
        await createBotFromText();
      }
      showToast(`Voice command: ${transcript}`);
      logActivity(`Processed voice command: ${transcript}`);
    };

    recognition.onerror = event => {
      showToast(`Voice recognition error: ${event.error}`);
    };

    speak('Welcome to the Voice Command Center! Say "create bot" followed by your idea.');
  } catch (error) {
    showToast(`Failed to load Voice Command: ${error.message}`);
    console.error('Voice Command Error:', error);
  }
}
