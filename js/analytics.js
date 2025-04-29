import { IDB, showToast, speak, logActivity } from './utils.js';

export async function loadAnalytics() {
  try {
    const statsDiv = document.getElementById('analytics-stats');
    statsDiv.innerHTML = '';
    const bots = await IDB.getAll('bots');
    const user = localStorage.getItem('currentUser');
    const userBots = bots.filter(b => b.creator === user || b.collaborators?.includes(user));
    const metrics = {
      totalBots: userBots.length,
      activeBots: userBots.filter(b => b.lastRun > Date.now() - 86400000).length,
      avgRuntime: userBots.reduce((sum, b) => sum + (b.runtime || 0), 0) / (userBots.length || 1)
    };
    Object.entries(metrics).forEach(([key, value]) => {
      const div = document.createElement('div');
      div.className = 'stat-card';
      div.innerHTML = `<p>${key}: ${value}</p>`;
      statsDiv.appendChild(div);
    });

    const botMetrics = document.getElementById('bot-metrics');
    botMetrics.innerHTML = '';
    userBots.forEach(bot => {
      const div = document.createElement('div');
      div.innerHTML = `<p>${bot.name}: ${bot.runtime || 0}ms runtime</p>`;
      botMetrics.appendChild(div);
    });

    // Placeholder for heatmap
    document.getElementById('heatmap').innerHTML = '<p>Usage heatmap (visualization placeholder)</p>';

    showToast('Analytics loaded successfully');
    logActivity('Loaded analytics dashboard');
    speak('Welcome to the Analytics Dashboard! View your bot metrics.');
  } catch (error) {
    showToast(`Failed to load Analytics: ${error.message}`);
    console.error('Analytics Error:', error);
  }
}
