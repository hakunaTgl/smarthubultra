import { showToast, speak, logActivity } from './utils.js';
import { loadBotsPage } from '../bots.html';

export async function startHoloGuide() {
  try {
    const guide = document.getElementById('holo-guide');
    guide.classList.remove('hidden');
    let step = 0;
    const steps = [
      'Welcome! Let’s set up your bot overseer.',
      'Create your first bot in the Bots section.',
      'Explore the Inspiration Lab for ideas.',
      'Use the Bot Builder for visual creation.',
      'Test your bots in the Playground.'
    ];

    document.getElementById('holo-message').textContent = steps[step];
    document.getElementById('holo-next').addEventListener('click', () => {
      step++;
      if (step >= steps.length) {
        guide.classList.add('hidden');
        document.getElementById('bots-modal').classList.remove('hidden');
        loadBotsPage();
        showToast('Holographic guide completed');
        logActivity('Completed holographic guide');
        return;
      }
      document.getElementById('holo-message').textContent = steps[step];
      speak(steps[step]);
    });

    speak(steps[0]);
  } catch (error) {
    showToast(`Failed to start Holographic Guide: ${error.message}`);
    console.error('Holographic Guide Error:', error);
  }
}
