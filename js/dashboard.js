import { IDB, showToast, speak, closeAllModals, logActivity } from './utils.js';
import { loadBotsPage } from './bots.js';

export async function loadDashboard() {
  const bots = await IDB.getAll('bots');
  document.getElementById('bot-status').textContent = `${bots.length} active`;
  try {
    const res = await fetch('https://api.openweathermap.org/data/2.5/weather?q=London&appid=4fc179285e1139b621267e810bb9ddcd');
    const data = await res.json();
    const weather = `${data.weather[0].description}, ${Math.round(data.main.temp - 273.15)}°C`;
    document.getElementById('weather').textContent = weather;
  } catch {
    document.getElementById('weather').textContent = 'Weather unavailable';
  }
  document.getElementById('ai-insights').textContent = 'Optimize bot runtime with Behavioral DNA validation.';
  const challengeList = document.getElementById('challenge-list');
  challengeList.innerHTML = '';
  dailyChallenges.forEach(ch => {
    const div = document.createElement('div');
    div.textContent = `${ch.description} - ${ch.reward} XP`;
    challengeList.appendChild(div);
  });

  document.querySelectorAll('.dashboard-widget').forEach(widget => {
    widget.addEventListener('click', () => {
      const action = widget.dataset.action;
      closeAllModals();
      if (action === 'view-bots' || action === 'create-bot') {
        document.getElementById('bots-modal').classList.remove('hidden');
        loadBotsPage();
      } else if (action === 'view-insights') {
        showToast('Insights: Validate bots daily to prevent rogue behavior');
      }
      logActivity(`Clicked dashboard widget: ${action}`);
    });
  });

  const user = await IDB.get('users', localStorage.getItem('currentUser'));
  if (!user.hasTakenTour) {
    document.getElementById('dashboard-tour').classList.remove('hidden');
    document.getElementById('next-tour-step').addEventListener('click', async () => {
      document.getElementById('dashboard-tour').classList.add('hidden');
      user.hasTakenTour = true;
      await IDB.batchSet('users', [user]);
      firebase.database().ref('users/' + user.email.replace(/[^a-zA-Z0-9]/g, '')).update({ hasTakenTour: true });
      showToast('Tour completed!');
    });
  }
}

export function showWelcome() {
  const welcomeModal = document.getElementById('welcome-modal');
  welcomeModal.classList.remove('hidden');
  const updatesDiv = document.getElementById('welcome-updates');
  updatesDiv.innerHTML = '';
  updates.forEach(update => {
    const p = document.createElement('p');
    p.innerHTML = `<b>${update.type.charAt(0).toUpperCase() + update.type.slice(1)}:</b> ${update.message} (${new Date(update.timestamp).toLocaleDateString()})`;
    updatesDiv.appendChild(p);
  });
  document.getElementById('dismiss-welcome').addEventListener('click', () => {
    welcomeModal.classList.add('hidden');
    document.getElementById('dashboard-modal').classList.remove('hidden');
    loadDashboard();
  });
  speak('Welcome to Smart Hub Ultra! Check out the recent updates.');
}

const updates = [
  { message: "Behavioral DNA Mapping for bot oversight", type: "feature", timestamp: Date.now() },
  { message: "Holographic Assistant for guided setup", type: "feature", timestamp: Date.now() },
  { message: "AR Control Mode for immersive bot management", type: "feature", timestamp: Date.now() },
  { message: "Predictive Task Automation for bot maintenance", type: "feature", timestamp: Date.now() },
  { message: "Collaborative Multi-User Mode for shared bot control", type: "feature", timestamp: Date.now() }
];

const dailyChallenges = [
  { id: "1", description: "Create a bot with Behavioral DNA Mapping", reward: 50 },
  { id: "2", description: "Collaborate with another user", reward: 75 },
  { id: "3", description: "Test a bot in the Playground", reward: 30 }
];
