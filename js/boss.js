import { IDB, showToast, speak, logActivity } from './utils.js';
import { getDatabase, ref, set } from 'firebase/database';
import { app } from './config.js';

const database = getDatabase(app);

export async function loadBossView() {
  try {
    const usersDiv = document.getElementById('boss-users');
    usersDiv.innerHTML = '';
    const users = await IDB.getAll('users');
    users.forEach(user => {
      const div = document.createElement('div');
      div.innerHTML = `<p>${user.email}: ${user.role}</p>`;
      usersDiv.appendChild(div);
    });

    const botsDiv = document.getElementById('boss-bots');
    botsDiv.innerHTML = '';
    const bots = await IDB.getAll('bots');
    bots.forEach(bot => {
      const div = document.createElement('div');
      div.innerHTML = `<p>${bot.name} by ${bot.creator}</p>`;
      botsDiv.appendChild(div);
    });

    const ticketsDiv = document.getElementById('boss-tickets');
    ticketsDiv.innerHTML = '';
    const tickets = await IDB.getAll('support');
    tickets.forEach(ticket => {
      const div = document.createElement('div');
      div.innerHTML = `<p>${ticket.email}: ${ticket.message}</p>`;
      ticketsDiv.appendChild(div);
    });

    const performanceDiv = document.getElementById('boss-performance');
    performanceDiv.innerHTML = '<p>System uptime: 99.9%</p>';

    const activityFeed = document.getElementById('activity-feed');
    activityFeed.innerHTML = '';
    const logs = await IDB.getAll('tracking');
    logs.forEach(log => {
      const div = document.createElement('div');
      div.innerHTML = `<p>${log.user}: ${log.action} at ${new Date(log.timestamp).toLocaleString()}</p>`;
      activityFeed.appendChild(div);
    });

    document.getElementById('broadcast-announcement').addEventListener('click', async () => {
      const message = document.getElementById('announcement-text').value;
      if (!message) {
        showToast('Enter an announcement message');
        return;
      }
      const notification = {
        id: Date.now().toString(),
        message,
        timestamp: Date.now()
      };
      await IDB.batchSet('notifications', [notification]);
      await set(ref(database, 'notifications/' + notification.id), notification);
      showToast('Announcement broadcasted');
      logActivity(`Broadcasted announcement: ${message}`);
    });

    speak('Welcome to the Boss View! Manage users, bots, and tickets.');
  } catch (error) {
    showToast(`Failed to load Boss View: ${error.message}`);
    console.error('Boss View Error:', error);
  }
}
