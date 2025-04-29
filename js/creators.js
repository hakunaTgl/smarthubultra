import { IDB, showToast, speak, logActivity } from './utils.js';

export async function loadCreatorsHub() {
  try {
    const botList = document.getElementById('bot-list');
    botList.innerHTML = '';
    const bots = await IDB.getAll('bots');
    bots.forEach(bot => {
      const div = document.createElement('div');
      div.className = 'bot-item';
      div.innerHTML = `<p>${bot.name} by ${bot.creator}</p>`;
      botList.appendChild(div);
    });

    document.getElementById('bot-search').addEventListener('input', e => {
      const query = e.target.value.toLowerCase();
      botList.innerHTML = '';
      bots.filter(bot => bot.name.toLowerCase().includes(query)).forEach(bot => {
        const div = document.createElement('div');
        div.className = 'bot-item';
        div.innerHTML = `<p>${bot.name} by ${bot.creator}</p>`;
        botList.appendChild(div);
      });
    });

    const showcase = document.getElementById('bot-showcase');
    showcase.innerHTML = '';
    bots.slice(0, 3).forEach(bot => {
      const div = document.createElement('div');
      div.className = 'showcase-item';
      div.innerHTML = `<p>${bot.name}: ${bot.purpose}</p>`;
      showcase.appendChild(div);
    });

    const leaderboard = document.getElementById('leaderboard');
    leaderboard.innerHTML = '';
    const users = await IDB.getAll('users');
    users.sort((a, b) => b.points - a.points).slice(0, 5).forEach(user => {
      const div = document.createElement('div');
      div.innerHTML = `<p>${user.username}: ${user.points} points</p>`;
      leaderboard.appendChild(div);
    });

    const trackingLogs = document.getElementById('tracking-logs');
    trackingLogs.innerHTML = '';
    const logs = await IDB.getAll('tracking');
    logs.forEach(log => {
      const div = document.createElement('div');
      div.innerHTML = `<p>${log.action} at ${new Date(log.timestamp).toLocaleString()}</p>`;
      trackingLogs.appendChild(div);
    });

    loadMarketplace();
    speak('Welcome to the Creator’s Hub! Explore and showcase bots.');
  } catch (error) {
    showToast(`Failed to load Creator’s Hub: ${error.message}`);
    console.error('Creator’s Hub Error:', error);
  }
}

async function loadMarketplace() {
  const featured = document.getElementById('featured-bots');
  featured.innerHTML = '';
  const marketplace = document.getElementById('marketplace');
  marketplace.innerHTML = '';
  const bots = await IDB.getAll('bots');
  bots.slice(0, 3).forEach(bot => {
    const div = document.createElement('div');
    div.className = 'featured-bot';
    div.innerHTML = `<p>${bot.name}: ${bot.purpose}</p>`;
    featured.appendChild(div);
  });
  bots.forEach(bot => {
    const div = document.createElement('div');
    div.className = 'bot-item';
    div.innerHTML = `<p>${bot.name} by ${bot.creator}</p>`;
    marketplace.appendChild(div);
  });
}
