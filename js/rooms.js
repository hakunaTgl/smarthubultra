import { IDB, showToast, speak, logActivity } from './utils.js';

export async function loadRooms() {
  try {
    const roomsDiv = document.getElementById('rooms-list');
    const userEmail = localStorage.getItem('currentUser');
    roomsDiv.innerHTML = '';

    const rooms = await IDB.getAll('rooms');
    rooms.forEach(room => {
      const div = document.createElement('div');
      div.className = 'room-item';
      div.innerHTML = `<p>${room.name} (${room.members.length} members)</p>`;
      const joinBtn = document.createElement('button');
      joinBtn.textContent = 'Join';
      joinBtn.addEventListener('click', () => joinRoom(room.id, userEmail));
      div.appendChild(joinBtn);
      roomsDiv.appendChild(div);
    });

    document.getElementById('create-room').addEventListener('click', async () => {
      const name = document.getElementById('room-name').value;
      if (!name) {
        showToast('Enter room name');
        return;
      }
      const id = Date.now().toString();
      const room = { id, name, members: [userEmail], created: Date.now() };
      await IDB.batchSet('rooms', [room]);
      firebase.database().ref('rooms/' + id).set(room);
      showToast('Room created');
      logActivity('Created room: ' + name);
      loadRooms();
    });

    speak('Rooms loaded');
    logActivity('Loaded rooms');
  } catch (error) {
    showToast(`Failed to load rooms: ${error.message}`);
  }
}

async function joinRoom(id, userEmail) {
  const room = await IDB.get('rooms', id);
  if (!room.members.includes(userEmail)) {
    room.members.push(userEmail);
    await IDB.batchSet('rooms', [room]);
    firebase.database().ref('rooms/' + id).update({ members: room.members });
    showToast('Joined room ' + room.name);
    logActivity('Joined room: ' + room.name);
  }
}
