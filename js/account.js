import { IDB, showToast, speak, logActivity, closeAllModals } from './utils.js';
import { setupTelegramNotifications } from './notifications.js';

export async function loadAccount() {
  try {
    const user = await IDB.get('users', localStorage.getItem('currentUser'));
    document.getElementById('account-username').textContent = user.username || 'N/A';
    document.getElementById('account-email').textContent = user.email;
    document.getElementById('account-bots').textContent = (await IDB.getAll('bots')).filter(b => b.creator === user.email).length;
    document.getElementById('account-points').textContent = user.points || 0;
    document.getElementById('account-level').textContent = user.level || 1;
    document.getElementById('account-badges').textContent = user.badges?.join(', ') || 'None';
    document.getElementById('level-progress-fill').style.width = `${(user.xp || 0) % 100}%`;

    document.getElementById('profile-pic-upload').addEventListener('change', async e => {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      document.getElementById('profile-pic').src = url;
      user.profilePic = url;
      await IDB.batchSet('users', [user]);
      firebase.database().ref('users/' + user.email.replace(/[^a-zA-Z0-9]/g, '')).update({ profilePic: url });
      showToast('Profile picture updated');
      logActivity('Updated profile picture');
    });

    document.getElementById('change-password').addEventListener('click', async () => {
      const newPassword = document.getElementById('new-password').value;
      const sixDigit = document.getElementById('new-six-digit').value;
      const fourDigit = document.getElementById('new-four-digit').value;
      if (newPassword.length < 8 || !/^\d{6}$/.test(sixDigit) || !/^\d{4}$/.test(fourDigit)) {
        showToast('Invalid input: Password (min 8 chars), 6-digit, and 4-digit codes required');
        return;
      }
      const previousPassword = user.password;
      user.password = newPassword;
      user.sixDigit = sixDigit;
      user.fourDigit = fourDigit;
      user.passwordChanges.push({ oldPassword: previousPassword, newPassword, timestamp: Date.now() });
      await IDB.batchSet('users', [user]);
      firebase.database().ref('users/' + user.email.replace(/[^a-zA-Z0-9]/g, '')).update(user);
      showToast('Credentials updated');
      logActivity('Updated account credentials');
    });

    document.getElementById('fetch-chat-id').addEventListener('click', async () => {
      const token = document.getElementById('telegram-token').value;
      const chatId = await fetchTelegramChatId(token);
      document.getElementById('telegram-chat-id').value = chatId;
      user.telegramChatId = chatId;
      await IDB.batchSet('users', [user]);
      firebase.database().ref('users/' + user.email.replace(/[^a-zA-Z0-9]/g, '')).update({ telegramChatId: chatId });
      showToast('Telegram Chat ID fetched');
      logActivity('Fetched Telegram Chat ID');
    });

    document.getElementById('apply-theme').addEventListener('click', async () => {
      const color = document.getElementById('theme-color').value;
      const image = document.getElementById('theme-image').files[0];
      const theme = { color, image: image ? URL.createObjectURL(image) : null };
      document.body.style.background = theme.image ? `url(${theme.image})` : theme.color;
      user.theme = theme;
      await IDB.batchSet('users', [user]);
      firebase.database().ref('users/' + user.email.replace(/[^a-zA-Z0-9]/g, '')).update({ theme });
      showToast('Theme applied');
      logActivity('Applied custom theme');
    });

    document.getElementById('theme-toggle').addEventListener('click', () => {
      document.body.classList.toggle('dark-theme');
      showToast('Theme toggled');
      logActivity('Toggled theme');
    });

    document.getElementById('webhook-setup').addEventListener('click', async () => {
      const token = document.getElementById('telegram-token').value;
      await setupTelegramWebhook(token);
      showToast('Webhook setup completed');
      logActivity('Setup Telegram webhook');
    });

    document.getElementById('enable-narration').addEventListener('change', e => {
      user.narration = e.target.checked;
      IDB.batchSet('users', [user]);
      firebase.database().ref('users/' + user.email.replace(/[^a-zA-Z0-9]/g, '')).update({ narration: e.target.checked });
      showToast(`AI narration ${e.target.checked ? 'enabled' : 'disabled'}`);
    });

    document.getElementById('telegram-notifs').addEventListener('change', e => {
      if (e.target.checked) {
        setupTelegramNotifications();
      }
    });

    document.getElementById('ar-mode').addEventListener('change', e => {
      user.arMode = e.target.checked;
      IDB.batchSet('users', [user]);
      firebase.database().ref('users/' + user.email.replace(/[^a-zA-Z0-9]/g, '')).update({ arMode: e.target.checked });
      showToast(`AR mode ${e.target.checked ? 'enabled' : 'disabled'}`);
    });

    speak('Welcome to the Account Portal! Manage your settings and profile.');
  } catch (error) {
    showToast(`Failed to load Account: ${error.message}`);
    console.error('Account Error:', error);
  }
}

async function fetchTelegramChatId(token) {
  // Simulate fetching chat ID
  return '123456789';
}

async function setupTelegramWebhook(token) {
  // Simulate webhook setup
}
