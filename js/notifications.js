import { IDB, showToast, speak, logActivity } from './utils.js';

export async function loadNotifications() {
  try {
    const notificationList = document.getElementById('notification-list');
    notificationList.innerHTML = '';
    const notifications = await IDB.getAll('notifications');
    notifications.forEach(n => {
      const div = document.createElement('div');
      div.innerHTML = `<p>${n.message} (${new Date(n.timestamp).toLocaleString()})</p>`;
      notificationList.appendChild(div);
    });
    document.getElementById('notification-count').textContent = notifications.length;
    document.getElementById('notification-count').classList.toggle('hidden', notifications.length === 0);

    document.getElementById('notification-icon').addEventListener('click', () => {
      document.getElementById('notification-dropdown').classList.toggle('hidden');
    });

    firebase.database().ref('notifications').on('child_added', async snapshot => {
      const notification = snapshot.val();
      notificationList.insertAdjacentHTML('afterbegin', `<div><p>${notification.message} (${new Date(notification.timestamp).toLocaleString()})</p></div>`);
      document.getElementById('notification-count').textContent = (await IDB.getAll('notifications')).length + 1;
      document.getElementById('notification-count').classList.remove('hidden');
      showToast(`New notification: ${notification.message}`);
      speak(`New notification: ${notification.message}`);
    });

    logActivity('Loaded notifications');
  } catch (error) {
    showToast(`Failed to load Notifications: ${error.message}`);
    console.error('Notifications Error:', error);
  }
}

export async function setupTelegramNotifications() {
  try {
    const user = await IDB.get('users', localStorage.getItem('currentUser'));
    if (!user.telegramChatId) {
      showToast('Set up Telegram Chat ID in Account Settings');
      return;
    }
    showToast('Telegram notifications enabled');
    logActivity('Enabled Telegram notifications');
  } catch (error) {
    showToast(`Failed to setup Telegram Notifications: ${error.message}`);
  }
}
