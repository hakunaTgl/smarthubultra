import { showToast, speak, logActivity } from './utils.js';
import { runPredictiveTasks } from './predictiveTasks.js';
import { loadNotifications } from './notifications.js';
import { generateInstanceCode } from './auth.js';

export async function loadDashboard() {
  try {
    const user = localStorage.getItem('currentUser');
    if (user) {
      document.getElementById('welcome-message').textContent = `Welcome, ${user}`;
    }

    await loadNotifications();
    
    // Existing predictive tasks button
    const predictiveBtn = document.getElementById('predictive-btn');
    if (predictiveBtn) {
      predictiveBtn.addEventListener('click', runPredictiveTasks);
    }
    
    // New instance code generation
    const generateCodeBtn = document.getElementById('generate-code-btn');
    const copyCodeBtn = document.getElementById('copy-code-btn');
    const codeDisplay = document.getElementById('instance-code-display');
    const generatedCodeSpan = document.getElementById('generated-code');
    
    if (generateCodeBtn) {
      generateCodeBtn.addEventListener('click', async () => {
        try {
          const code = await generateInstanceCode(24); // 24 hours expiration
          generatedCodeSpan.textContent = code;
          codeDisplay.style.display = 'block';
          showToast('Instance code generated!');
          logActivity('Generated instance code');
        } catch (error) {
          showToast('Failed to generate instance code');
          console.error('Code generation error:', error);
        }
      });
    }
    
    if (copyCodeBtn) {
      copyCodeBtn.addEventListener('click', async () => {
        try {
          const code = generatedCodeSpan.textContent;
          await navigator.clipboard.writeText(code);
          showToast('Code copied to clipboard!');
        } catch (error) {
          showToast('Failed to copy code');
        }
      });
    }
    
    displayWeather();

    showToast('Dashboard loaded');
    logActivity('Loaded dashboard');
    speak('Welcome to the dashboard!');
  } catch (error) {
    showToast(`Failed to load dashboard: ${error.message}`);
    console.error('Dashboard Error:', error);
  }
}

function displayWeather() {
  const weatherDiv = document.getElementById('weather');
  weatherDiv.textContent = '72°F and Sunny';
}
