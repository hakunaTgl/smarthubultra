import { IDB, showToast, speak, logActivity } from './utils.js';
import { dbRef, onChildAdded, get } from './firebaseConfig.js';

export async function loadNotifications() {
  try {
    const notificationList = document.getElementById('notification-list');
    const notificationCount = document.getElementById('notification-count');
    const notificationIcon = document.getElementById('notification-icon');
    if (!notificationList || !notificationCount) return;

    notificationList.innerHTML = '';
    const notifications = await IDB.getAll('notifications');
    notifications.forEach(n => {
      const div = document.createElement('div');
      div.innerHTML = `<p>${n.message} (${new Date(n.timestamp).toLocaleString()})</p>`;
      notificationList.appendChild(div);
    });
    notificationCount.textContent = notifications.length;
    notificationCount.classList.toggle('hidden', notifications.length === 0);

    if (notificationIcon) {
      notificationIcon.addEventListener('click', () => {
        notificationList.classList.toggle('hidden');
      });
    }

    await bootstrapRemoteNotifications(notificationList, notificationCount);

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

async function bootstrapRemoteNotifications(list, countEl) {
  if (!list || !countEl) return;
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
    countEl.textContent = count;
    countEl.classList.toggle('hidden', count === 0);
    showToast(`New notification: ${notification.message}`);
    speak(`New notification: ${notification.message}`);
  });
}
