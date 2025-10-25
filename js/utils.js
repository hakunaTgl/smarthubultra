export function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

export function speak(text) {
  if (window.speechSynthesis) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  }
}

export function closeAllModals() {
  document.querySelectorAll('.modal').forEach(modal => modal.classList.add('hidden'));
}

export function logActivity(action) {
  const log = {
    id: Date.now().toString(),
    user: localStorage.getItem('currentUser'),
    action,
    timestamp: Date.now()
  };
  try {
    IDB.batchSet('tracking', [log]);
    // Use window.firebase if available, otherwise skip Firebase logging
    if (window.firebase && window.firebase.database) {
      window.firebase.database().ref('tracking/' + log.id).set(log);
    }
  } catch (err) {
    console.warn('Failed to log activity:', err);
  }
}

export const IDB = {
  async get(store, key) {
    const db = await openDB();
    const tx = db.transaction(store, 'readonly');
    return tx.objectStore(store).get(key);
  },
  async getAll(store) {
    const db = await openDB();
    const tx = db.transaction(store, 'readonly');
    return tx.objectStore(store).getAll();
  },
  async batchSet(store, items) {
    const db = await openDB();
    const tx = db.transaction(store, 'readwrite');
    for (const item of items) {
      if (item._delete) {
        await tx.objectStore(store).delete(item.id || item.botId);
      } else {
        await tx.objectStore(store).put(item);
      }
    }
    await tx.done;
  }
};

async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SmartHubUltra', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'email' });
      }
      if (!db.objectStoreNames.contains('bots')) {
        db.createObjectStore('bots', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('behavioral_dna')) {
        db.createObjectStore('behavioral_dna', { keyPath: 'botId' });
      }
      if (!db.objectStoreNames.contains('versions')) {
        db.createObjectStore('versions', { keyPath: 'timestamp' });
      }
      if (!db.objectStoreNames.contains('support')) {
        db.createObjectStore('support', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('tracking')) {
        db.createObjectStore('tracking', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('notifications')) {
        db.createObjectStore('notifications', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
