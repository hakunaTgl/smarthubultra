import { showToast } from './utils.js';

const STORAGE_KEY = 'shuUserCodes';
const ACTIVE_KEY = 'shuActiveUserCode';

function generateNumericCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function sanitizeUsername(value = '') {
  return value.trim();
}

function isValidUsername(value) {
  return /^[A-Za-z0-9_-]{4,16}$/.test(value);
}

function loadSavedCodes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to parse saved codes', err);
    return [];
  }
}

function persistCodes(codes = []) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
}

function formatTimestamp(ts) {
  return new Date(ts).toLocaleString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric'
  });
}

function renderActivePanel(entry) {
  const usernameEl = document.getElementById('active-username');
  const codeValueEl = document.getElementById('active-code-value');
  const metaEl = document.getElementById('active-code-meta');
  const copyBtn = document.getElementById('copy-code-btn');

  if (!entry) {
    if (usernameEl) usernameEl.textContent = 'No code selected';
    if (codeValueEl) codeValueEl.textContent = '------';
    if (metaEl) metaEl.textContent = 'Create or resume a build to see details here.';
    if (copyBtn) copyBtn.disabled = true;
    return;
  }

  if (usernameEl) usernameEl.textContent = entry.username;
  if (codeValueEl) codeValueEl.textContent = entry.code;
  if (metaEl) metaEl.textContent = `Created ${formatTimestamp(entry.createdAt)} • Last opened ${formatTimestamp(entry.updatedAt || entry.createdAt)}`;
  if (copyBtn) {
    copyBtn.disabled = false;
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(entry.code);
        showToast('Code copied');
      } catch (err) {
        console.warn('Clipboard unavailable', err);
        showToast('Copy not available in this browser');
      }
    };
  }
}

function renderHistory(codes = [], activeCode = null) {
  const container = document.getElementById('code-history');
  if (!container) return;
  container.innerHTML = '';

  if (!codes.length) {
    const empty = document.createElement('p');
    empty.className = 'microcopy';
    empty.textContent = 'Your saved references will appear here.';
    container.appendChild(empty);
    return;
  }

  codes
    .sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt))
    .forEach((entry) => {
      const item = document.createElement('div');
      item.className = 'history-item';
      if (entry.code === activeCode) item.classList.add('active');

      const title = document.createElement('div');
      title.className = 'history-item__title';
      title.textContent = `${entry.username}`;

      const meta = document.createElement('div');
      meta.className = 'history-item__meta';
      meta.textContent = `${entry.code} • updated ${formatTimestamp(entry.updatedAt || entry.createdAt)}`;

      const action = document.createElement('button');
      action.type = 'button';
      action.className = 'ghost';
      action.textContent = entry.code === activeCode ? 'Active' : 'Open';
      action.disabled = entry.code === activeCode;
      action.addEventListener('click', () => {
        setActiveCode(entry);
        showToast('Reference opened');
      });

      item.appendChild(title);
      item.appendChild(meta);
      item.appendChild(action);
      container.appendChild(item);
    });
}

function setActiveCode(entry) {
  if (!entry) return;
  const codes = loadSavedCodes();
  const updated = codes.map((item) => (item.code === entry.code ? { ...item, updatedAt: Date.now() } : item));
  persistCodes(updated);
  localStorage.setItem(ACTIVE_KEY, entry.code);
  renderActivePanel({ ...entry, updatedAt: Date.now() });
  renderHistory(updated, entry.code);
}

function handleStartBuild(usernameInput) {
  const username = sanitizeUsername(usernameInput?.value || '');
  if (!username) {
    showToast('Enter a username to generate a code');
    return;
  }
  if (!isValidUsername(username)) {
    showToast('Username must be 4-16 characters (letters, numbers, _ or -)');
    return;
  }

  const code = generateNumericCode();
  const now = Date.now();
  const entry = { code, username, createdAt: now, updatedAt: now };

  const codes = loadSavedCodes();
  codes.push(entry);
  persistCodes(codes);
  localStorage.setItem(ACTIVE_KEY, code);

  renderActivePanel(entry);
  renderHistory(codes, code);
  if (usernameInput) usernameInput.value = '';
  showToast(`Reference ready: ${code}`);
}

function handleResume(form) {
  const input = document.getElementById('resume-code-input');
  if (!input) return;
  const raw = (input.value || '').trim();
  const code = raw.replace(/\D/g, '').slice(0, 6);
  input.value = code;

  if (!/^\d{6}$/.test(code)) {
    showToast('Enter a 6-digit code');
    return;
  }

  const codes = loadSavedCodes();
  const match = codes.find((item) => item.code === code);
  if (!match) {
    showToast('Code not found. Generate a new reference.');
    return;
  }

  setActiveCode(match);
  form?.reset();
  showToast('Reference restored');
}

function wireClearHistory() {
  const clearBtn = document.getElementById('clear-history-btn');
  if (!clearBtn) return;
  clearBtn.addEventListener('click', () => {
    persistCodes([]);
    localStorage.removeItem(ACTIVE_KEY);
    renderActivePanel(null);
    renderHistory([], null);
    showToast('History cleared');
  });
}

export async function loadCodeReference() {
  const usernameInput = document.getElementById('username-input');
  const startBtn = document.getElementById('start-build-btn');
  const resumeForm = document.getElementById('resume-form');

  const savedCodes = loadSavedCodes();
  const activeCode = localStorage.getItem(ACTIVE_KEY);
  const activeEntry = savedCodes.find((item) => item.code === activeCode) || savedCodes[0] || null;

  renderActivePanel(activeEntry);
  renderHistory(savedCodes, activeEntry?.code || null);
  wireClearHistory();

  if (startBtn) {
    startBtn.addEventListener('click', () => handleStartBuild(usernameInput));
  }

  if (resumeForm) {
    resumeForm.addEventListener('submit', (event) => {
      event.preventDefault();
      handleResume(resumeForm);
    });
  }
}
