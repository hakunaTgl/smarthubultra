import { IDB, showToast, logActivity } from './utils.js';
import { dbRef, set, get, onChildAdded } from './firebaseConfig.js';

const STORE = 'versions';
const CLOUD_PATH = 'systemUpdates';
const DEFAULT_UPDATES = [
  {
    timestamp: Date.now() - 86400000 * 3,
    title: 'Instance Code Access',
    summary: 'Added secure instance-code sign-in with one-time codes and session logging.',
    tags: ['auth', 'security']
  },
  {
    timestamp: Date.now() - 86400000 * 2,
    title: 'Adaptive Dashboard',
    summary: 'Refreshed dashboard layout with predictive tasks, notifications, and copyable codes.',
    tags: ['ui', 'dashboard']
  },
  {
    timestamp: Date.now() - 86400000,
    title: 'Bot Intelligence Layer',
    summary: 'Introduced behavioral DNA validation plus predictive anomaly scanning for bots.',
    tags: ['bots', 'automation']
  }
];

let seedPromise;

export async function loadSystemUpdates(containerId) {
  const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!container) return;
  await ensureSeeded();
  const entries = await readUpdates();
  renderUpdates(container, entries);
  bootstrapRealtimeUpdates(container);
}

export async function recordSystemUpdate(update) {
  await ensureSeeded();
  const entry = {
    timestamp: Date.now(),
    title: update.title || 'Update',
    summary: update.summary || '',
    tags: update.tags || []
  };
  await IDB.batchSet(STORE, [entry]);
  try {
    await set(dbRef(`${CLOUD_PATH}/${entry.timestamp}`), entry);
  } catch (error) {
    console.warn('Failed to sync update to cloud', error);
  }
  logActivity(`System update logged: ${entry.title}`);
  showToast('System update published');
  return entry;
}

async function ensureSeeded() {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const existing = await IDB.getAll(STORE);
    if (!existing?.length) {
      await IDB.batchSet(STORE, DEFAULT_UPDATES);
      for (const entry of DEFAULT_UPDATES) {
        try {
          await set(dbRef(`${CLOUD_PATH}/${entry.timestamp}`), entry);
        } catch (error) {
          console.warn('Failed to seed update log', error);
        }
      }
    }
  })();
  return seedPromise;
}

async function readUpdates() {
  const combined = new Map();
  const local = await IDB.getAll(STORE);
  local.forEach(entry => combined.set(entry.timestamp, entry));
  try {
    const snapshot = await get(dbRef(CLOUD_PATH));
    if (snapshot.exists()) {
      const remote = Object.values(snapshot.val());
      remote.forEach(entry => combined.set(entry.timestamp, entry));
    }
  } catch (error) {
    console.warn('Failed to fetch remote updates', error);
  }
  return Array.from(combined.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

function bootstrapRealtimeUpdates(container) {
  const ref = dbRef(CLOUD_PATH);
  onChildAdded(ref, snapshot => {
    const entry = snapshot.val();
    if (!entry?.timestamp) return;
    IDB.batchSet(STORE, [entry]).then(async () => {
      const entries = await readUpdates();
      renderUpdates(container, entries);
    }).catch(error => console.warn('Failed to merge realtime update', error));
  });
}

function renderUpdates(container, entries) {
  if (!entries.length) {
    container.innerHTML = '<p>No updates yet. Check back soon.</p>';
    return;
  }
  const html = entries.slice(0, 12).map(entry => renderUpdateCard(entry)).join('');
  container.innerHTML = html;
}

function renderUpdateCard(entry) {
  const tags = (entry.tags || []).map(tag => `<span class="update-tag">${tag}</span>`).join('');
  return `
    <article class="update-card glassmorphic">
      <div class="update-card-header">
        <h4>${entry.title}</h4>
        <time>${formatTimestamp(entry.timestamp)}</time>
      </div>
      <p>${entry.summary}</p>
      ${tags ? `<div class="update-tags">${tags}</div>` : ''}
    </article>
  `;
}

function formatTimestamp(value) {
  if (!value) return '';
  return new Date(value).toLocaleString();
}
