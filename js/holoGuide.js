import { showToast, speak, logActivity } from './utils.js';

export async function startHoloGuide() {
  try {
    const guide = document.getElementById('holo-guide');
    const messageEl = document.getElementById('holo-message');
    const nextBtn = document.getElementById('holo-next');
    if (!guide || !messageEl || !nextBtn) {
      showToast('Holographic guide elements missing');
      return;
    }
    guide.classList.remove('hidden');
    let step = 0;
    const steps = [
      'Welcome! Let’s set up your bot overseer.',
      'Create your first bot in the Bots section.',
      'Explore the Inspiration Lab for ideas.',
      'Use the Bot Builder for visual creation.',
      'Test your bots in the Playground.'
    ];

    messageEl.textContent = steps[step];
    nextBtn.addEventListener('click', () => {
      step++;
      if (step >= steps.length) {
        guide.classList.add('hidden');
        showToast('Holographic guide completed');
        logActivity('Completed holographic guide');
        return;
      }
      messageEl.textContent = steps[step];
      speak(steps[step]);
    });

    speak(steps[0]);
  } catch (error) {
    showToast(`Failed to start Holographic Guide: ${error.message}`);
    console.error('Holographic Guide Error:', error);
  }
}
