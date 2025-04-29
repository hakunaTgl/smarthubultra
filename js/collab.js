import { IDB, showToast, speak, logActivity } from './utils.js';

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
      firebase.database().ref('bots/' + bot.id).update({ collaborators: bot.collaborators });
      showToast(`Invited ${email} to collaborate`);
      logActivity(`Invited ${email} to collaborate on bot: ${bot.name}`);
    });

    const editor = document.getElementById('collab-editor');
    editor.value = JSON.parse(localStorage.getItem('editingBot') || '{}').code || '';
    firebase.database().ref('collab/' + localStorage.getItem('currentUser')).on('value', snapshot => {
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
      firebase.database().ref('chat/' + Date.now()).set(chat);
      document.getElementById('chat-input').value = '';
      logActivity(`Sent chat message: ${message}`);
    });

    firebase.database().ref('chat').on('child_added', snapshot => {
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
    firebase.database().ref('collab/' + bot.creator).set({ code: bot.code });
    bot.collaborators?.forEach(collab => {
      firebase.database().ref('collab/' + collab).set({ code: bot.code });
    });
  } catch (error) {
    showToast(`Failed to setup collaborative mode: ${error.message}`);
  }
}
