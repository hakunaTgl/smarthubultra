import { IDB, showToast, speak, logActivity } from './utils.js';
import { dbRef, onChildAdded, get } from './firebaseConfig.js';

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
      document.getElementById('notification-list').classList.toggle('hidden');
    });

    await bootstrapRemoteNotifications(notificationList);

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

async function bootstrapRemoteNotifications(list) {
  try {
    const snapshot = await get(dbRef('notifications'));
    if (snapshot.exists()) {
      const payload = Object.values(snapshot.val());
      await IDB.batchSet('notifications', payload);
    }
  } catch (error) {
    console.warn('Failed to load remote notifications', error);
  }

  const ref = dbRef('notifications');
  onChildAdded(ref, async snapshot => {
    const notification = snapshot.val();
    if (!notification) return;
    await IDB.batchSet('notifications', [notification]);
    list.insertAdjacentHTML('afterbegin', `<div><p>${notification.message} (${new Date(notification.timestamp).toLocaleString()})</p></div>`);
    const count = (await IDB.getAll('notifications')).length;
    document.getElementById('notification-count').textContent = count;
    document.getElementById('notification-count').classList.toggle('hidden', count === 0);
    showToast(`New notification: ${notification.message}`);
    speak(`New notification: ${notification.message}`);
  });
}
