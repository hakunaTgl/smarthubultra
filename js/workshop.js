import { showToast, speak, logActivity } from './utils.js';

export async function loadAIWorkshop() {
  try {
    const codeTextarea = document.getElementById('workshop-code');
    codeTextarea.value = '// Write your code here\nconsole.log("Hello, Smart Hub Ultra!");';

    document.getElementById('debug-code').addEventListener('click', async () => {
      const code = codeTextarea.value;
      const suggestions = await debugCode(code);
      document.getElementById('workshop-suggestions').innerHTML = suggestions.map(s => `<p>${s}</p>`).join('');
      showToast('Code debugged with AI suggestions');
      logActivity('Debugged code in AI Workshop');
    });

    document.getElementById('review-code').addEventListener('click', async () => {
      const code = codeTextarea.value;
      const review = await reviewCode(code);
      document.getElementById('code-review').innerHTML = `<p>${review}</p>`;
      showToast('Code reviewed by AI');
      logActivity('Reviewed code in AI Workshop');
    });

    speak('Welcome to the AI Workshop! Debug or review your code.');
  } catch (error) {
    showToast(`Failed to load AI Workshop: ${error.message}`);
    console.error('AI Workshop Error:', error);
  }
}

async function debugCode(code) {
  // Simulate AI debugging
  try {
    new Function(code);
    return ['No syntax errors detected. Consider adding error handling.'];
  } catch (e) {
    return [`Syntax error: ${e.message}`, 'Check for missing semicolons or incorrect brackets.'];
  }
}

async function reviewCode(code) {
  // Simulate AI code review
  return 'Code looks functional but could benefit from modularization and comments for clarity.';
}
