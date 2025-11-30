import { IDB, showToast, speak, logActivity } from './utils.js';
import { getDatabase, ref, set, update, onValue, onChildAdded } from 'firebase/database';
import { app } from './config.js';

const database = getDatabase(app);

export async function loadCollabHub() {
  try {
    document.getElementById('invite-user').addEventListener('click', async () => {
      const email = document.getElementById('collab-user').value;
      if (!email) {
        showToast('Enter a user email to invite');
        return;
      }
      const user = await IDB.get('users', email);
      if (!user) {
        showToast('User not found');
        return;
      }
      const bot = JSON.parse(localStorage.getItem('editingBot') || '{}');
      bot.collaborators = bot.collaborators || [];
      bot.collaborators.push(email);
      await IDB.batchSet('bots', [bot]);
      await update(ref(database, 'bots/' + bot.id), { collaborators: bot.collaborators });
      showToast(`Invited ${email} to collaborate`);
      logActivity(`Invited ${email} to collaborate on bot: ${bot.name}`);
    });

    const editor = document.getElementById('collab-editor');
    editor.value = JSON.parse(localStorage.getItem('editingBot') || '{}').code || '';
    onValue(ref(database, 'collab/' + localStorage.getItem('currentUser')), snapshot => {
      const data = snapshot.val();
      if (data && data.code !== editor.value) {
        editor.value = data.code;
        showToast('Code updated from collaborator');
      }
    });

    document.getElementById('send-chat').addEventListener('click', () => {
      const message = document.getElementById('chat-input').value;
      if (!message) return;
      const chat = {
        user: localStorage.getItem('currentUser'),
        message,
        timestamp: Date.now()
      };
      set(ref(database, 'chat/' + Date.now()), chat);
      document.getElementById('chat-input').value = '';
      logActivity(`Sent chat message: ${message}`);
    });

    onChildAdded(ref(database, 'chat'), snapshot => {
      const chat = snapshot.val();
      const messages = document.getElementById('chat-messages');
      const div = document.createElement('div');
      div.className = chat.user === localStorage.getItem('currentUser') ? 'message-user' : 'message-other';
      div.textContent = `${chat.user}: ${chat.message}`;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    });

    document.getElementById('collab-chat').classList.remove('hidden');
    speak('Welcome to the Collab Hub! Invite users and code together.');
  } catch (error) {
    showToast(`Failed to load Collab Hub: ${error.message}`);
    console.error('Collab Hub Error:', error);
  }
}

export async function setupCollaborativeMode(bot) {
  try {
    await set(ref(database, 'collab/' + bot.creator), { code: bot.code });
    bot.collaborators?.forEach(collab => {
      set(ref(database, 'collab/' + collab), { code: bot.code });
    });
  } catch (error) {
    showToast(`Failed to setup collaborative mode: ${error.message}`);
  }
}
