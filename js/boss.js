import { IDB, showToast, speak, logActivity } from './utils.js';

const FALLBACK_BEHAVIORAL_PREFIX = 'behavioral_dna:';
const MAX_TIMELINE_ITEMS = 14;

export async function loadBossView() {
  try {
    const dom = collectDomRefs();
    const [users, bots, tickets, logs, dnaRecords] = await Promise.all([
      safeGetAll('users'),
      safeGetAll('bots'),
      safeGetAll('support'),
      safeGetAll('tracking'),
      fetchBehavioralDna()
    ]);

    const dnaIndex = indexBehavioralDna(dnaRecords);
    renderUserRoster(dom.users, users, dnaIndex);
    renderBotInventory(dom.bots, bots);
    renderSupportTickets(dom.tickets, tickets);
    renderPerformance(dom.performance, { users, bots, logs, dnaIndex });
    renderActivityFeed(dom.activityFeed, logs);
    renderDnaOverview(dom.dnaOverview, dnaIndex, users);
    renderDnaTimeline(dom.dnaTimeline, dnaIndex, users);
    renderGrowthSignals(dom.dnaGrowth, dnaIndex);
    wireBroadcast(dom.broadcastBtn, dom.announcementInput);

    showToast('Boss intelligence center ready');
    speak('Boss intelligence center activated. All signals are live.');
    logActivity('boss-view:loaded', {
      users: users.length,
      bots: bots.length,
      dnaRecords: dnaRecords.length
    });
  } catch (error) {
    showToast(`Failed to load Boss View: ${error.message}`);
    console.error('Boss View Error:', error);
  }
}

function collectDomRefs() {
  return {
    users: document.getElementById('boss-users'),
    bots: document.getElementById('boss-bots'),
    tickets: document.getElementById('boss-tickets'),
    performance: document.getElementById('boss-performance'),
    activityFeed: document.getElementById('activity-feed'),
    dnaOverview: document.getElementById('boss-dna-overview'),
    dnaTimeline: document.getElementById('boss-dna-timeline'),
    dnaGrowth: document.getElementById('boss-dna-growth'),
    announcementInput: document.getElementById('announcement-text'),
    broadcastBtn: document.getElementById('broadcast-announcement')
  };
}

async function safeGetAll(store) {
  try {
    return await IDB.getAll(store);
  } catch (err) {
    console.warn(`IDB getAll failed for ${store}`, err);
    return [];
  }
}

async function fetchBehavioralDna() {
  const records = [];
  try {
    if (window.firebase && window.firebase.database) {
      const snapshot = await window.firebase.database().ref('behavioral_dna').once('value');
      const value = snapshot?.val() || {};
      Object.values(value).forEach(entry => {
        const normalized = normalizeDna(entry);
        if (normalized) records.push(normalized);
      });
    }
  } catch (err) {
    console.warn('Remote behavioral DNA fetch failed', err);
  }

  if (!records.length && typeof localStorage !== 'undefined') {
    try {
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (!key || !key.startsWith(FALLBACK_BEHAVIORAL_PREFIX)) continue;
        const cached = JSON.parse(localStorage.getItem(key) || '[]');
        cached.forEach(entry => {
          const normalized = normalizeDna(entry);
          if (normalized) records.push(normalized);
        });
      }
    } catch (err) {
      console.warn('Local behavioral DNA fallback failed', err);
    }
  }

  return records.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

function normalizeDna(entry) {
  if (!entry || !entry.user) return null;
  const ts = typeof entry.timestamp === 'string' ? Date.parse(entry.timestamp) : entry.timestamp;
  return {
    ...entry,
    timestamp: ts || Date.now()
  };
}

function indexBehavioralDna(records = []) {
  const byUser = new Map();
  records.forEach(record => {
    const key = record.user;
    if (!key) return;
    const bucket = byUser.get(key) || { user: key, records: [] };
    bucket.records.push(record);
    byUser.set(key, bucket);
  });
  byUser.forEach(bucket => {
    bucket.records.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  });
  return byUser;
}

function renderUserRoster(container, users = [], dnaIndex) {
  if (!container) return;
  if (!users.length) {
    container.innerHTML = '<p class="empty-state">No users synced yet.</p>';
    return;
  }
  container.innerHTML = users
    .sort((a, b) => (b.sessions || 0) - (a.sessions || 0))
    .map(user => {
      const sanitized = sanitizeKey(user.email);
      const dna = dnaIndex.get(sanitized)?.records?.[0];
      const sessions = user.sessions || 0;
      const lastMethod = user.lastSignInMethod || 'unknown';
  const lastLink = formatTimestamp(user.lastEmailLink?.usedAt);
  const lastInstance = formatTimestamp(user.lastInstanceCode?.usedAt);
      const dominant = dna ? formatTrait(dna.dominantTrait, dna.vibeScore) : 'No vibe profile yet';
      const trajectory = dna?.trajectory || '—';
      const growthEdge = dna?.growthEdge?.target ? dna.growthEdge.target.toUpperCase() : '—';
      return `
  <article class="boss-entity-card">
          <header>
            <div>
              <strong>${user.username || user.email}</strong>
              <span class="boss-entity-meta">${user.email}</span>
            </div>
            <span class="boss-role ${user.role === 'admin' ? 'boss-role--admin' : ''}">${user.role || 'user'}</span>
          </header>
          <dl class="boss-entity-stats">
            <div><dt>Sessions</dt><dd>${sessions}</dd></div>
            <div><dt>Last sign-in method</dt><dd>${lastMethod}</dd></div>
            <div><dt>Magic link used</dt><dd>${lastLink}</dd></div>
            <div><dt>Instance code requested</dt><dd>${lastInstance}</dd></div>
            <div><dt>Dominant trait</dt><dd>${dominant}</dd></div>
            <div><dt>Trajectory</dt><dd>${trajectory}</dd></div>
            <div><dt>Growth focus</dt><dd>${growthEdge}</dd></div>
          </dl>
        </article>
      `;
    })
    .join('');
}

function renderBotInventory(container, bots = []) {
  if (!container) return;
  if (!bots.length) {
    container.innerHTML = '<p class="empty-state">No bots deployed yet.</p>';
    return;
  }
  const statusCounts = bots.reduce((acc, bot) => {
    const status = bot.status || 'active';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  const creators = bots.reduce((acc, bot) => {
    const key = bot.creator || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  container.innerHTML = `
    <div class="boss-metric-grid">
      ${Object.entries(statusCounts).map(([status, count]) => `
        <div class="boss-metric">
          <span class="boss-metric-label">${status}</span>
          <strong class="boss-metric-value">${count}</strong>
        </div>
      `).join('')}
    </div>
    <div class="boss-entity-list">
      ${bots.slice(0, 6).map(bot => `
        <article class="boss-entity-card boss-entity-card--compact">
          <header>
            <div>
              <strong>${bot.name || 'Untitled Bot'}</strong>
              <span class="boss-entity-meta">${bot.creator || 'unknown owner'}</span>
            </div>
            <span class="boss-pill">${bot.status || 'active'}</span>
          </header>
          <p class="boss-entity-note">${bot.purpose || 'No purpose documented'}</p>
        </article>
      `).join('')}
    </div>
    <p class="boss-footnote">Top creators: ${formatTopK(creators)}</p>
  `;
}

function renderSupportTickets(container, tickets = []) {
  if (!container) return;
  if (!tickets.length) {
    container.innerHTML = '<p class="empty-state">No support tickets open.</p>';
    return;
  }
    container.innerHTML = tickets
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, 6)
    .map(ticket => `
      <article class="boss-entity-card boss-entity-card--compact">
        <header>
          <div>
            <strong>${ticket.email}</strong>
              <span class="boss-entity-meta">${formatTimestamp(ticket.timestamp || Date.now())}</span>
          </div>
          <span class="boss-pill">${ticket.status || 'open'}</span>
        </header>
        <p class="boss-entity-note">${ticket.message}</p>
      </article>
    `)
    .join('');
}

function renderPerformance(container, context) {
  if (!container) return;
  const { users, bots, logs, dnaIndex } = context;
  const totalSessions = users.reduce((acc, user) => acc + (user.sessions || 0), 0);
  const activeBots = bots.filter(bot => bot.status !== 'archived').length;
  const avgVibe = averageDominantScore(dnaIndex);
  const broadcastCount = logs.filter(log => String(log.action || '').includes('Broadcasted')).length;

  container.innerHTML = `
    <div class="boss-metric-grid">
      <div class="boss-metric">
        <span class="boss-metric-label">Total users</span>
        <strong class="boss-metric-value">${users.length}</strong>
      </div>
      <div class="boss-metric">
        <span class="boss-metric-label">Active bots</span>
        <strong class="boss-metric-value">${activeBots}</strong>
      </div>
      <div class="boss-metric">
        <span class="boss-metric-label">Lifetime sessions</span>
        <strong class="boss-metric-value">${totalSessions}</strong>
      </div>
      <div class="boss-metric">
        <span class="boss-metric-label">Avg vibe score</span>
        <strong class="boss-metric-value">${avgVibe}%</strong>
      </div>
      <div class="boss-metric">
        <span class="boss-metric-label">Broadcasts</span>
        <strong class="boss-metric-value">${broadcastCount}</strong>
      </div>
    </div>
  `;
}

function renderActivityFeed(container, logs = []) {
  if (!container) return;
  if (!logs.length) {
    container.innerHTML = '<p class="empty-state">No activity logged yet.</p>';
    return;
  }
  const entries = logs
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, 10)
    .map(log => `
      <div class="activity-row glassmorphic">
        <div>
          <strong>${log.action}</strong>
          <p>${log.user || 'unknown user'}</p>
        </div>
        <time>${formatTimestamp(log.timestamp || Date.now())}</time>
      </div>
    `)
    .join('');
  container.innerHTML = entries;
}

function renderDnaOverview(container, dnaIndex, users = []) {
  if (!container) return;
  if (!dnaIndex.size) {
    container.innerHTML = '<p class="empty-state">No vibe profiles generated yet.</p>';
    return;
  }
  const userIndex = buildUserIndex(users);
  const cards = Array.from(dnaIndex.values())
    .map(bucket => ({ bucket, latest: bucket.records[0] }))
    .sort((a, b) => (b.latest.timestamp || 0) - (a.latest.timestamp || 0))
    .slice(0, 8)
    .map(({ bucket, latest }) => {
      const person = userIndex.get(bucket.user);
      const name = person?.username || person?.email || bucket.user;
      const boosters = (latest.boosters || []).slice(0, 3).map(tip => `<li>${tip}</li>`).join('');
      const traits = Object.entries(latest.normalized || {})
        .map(([trait, value]) => `<li><span>${trait}</span><strong>${value}%</strong></li>`)
        .join('');
      return `
        <article class="dna-card">
          <header>
            <div>
              <strong>${name}</strong>
              <span class="boss-entity-meta">${formatTimestamp(latest.timestamp)}</span>
            </div>
            <span class="dna-trait dna-trait--${latest.dominantTrait}">${latest.dominantTrait || '—'}</span>
          </header>
          <p class="dna-description">${latest.narrative?.description || ''}</p>
          <p class="dna-trend">${latest.narrative?.trend || ''}</p>
          <p class="dna-boost">${latest.narrative?.boost || ''}</p>
          <ul class="dna-traits">${traits}</ul>
          <div class="dna-boosters">
            <h5>Boosters</h5>
            <ul>${boosters}</ul>
          </div>
        </article>
      `;
    });
  container.innerHTML = cards.length ? cards.join('') : '<p class="empty-state">Behavioral DNA records found, but none with complete metadata yet.</p>';
}

function renderDnaTimeline(container, dnaIndex, users = []) {
  if (!container) return;
  const userIndex = buildUserIndex(users);
  const timeline = Array.from(dnaIndex.values()).flatMap(bucket => bucket.records.map(record => ({
    record,
    user: bucket.user,
    person: userIndex.get(bucket.user)
  })));
  if (!timeline.length) {
    container.innerHTML = '<p class="empty-state">No evolution events captured yet.</p>';
    return;
  }
  const entries = timeline
    .sort((a, b) => (b.record.timestamp || 0) - (a.record.timestamp || 0))
    .slice(0, MAX_TIMELINE_ITEMS)
    .map(item => `
      <div class="dna-timeline-entry">
        <div>
          <strong>${item.person?.username || item.person?.email || item.user}</strong>
          <span class="dna-trait dna-trait--${item.record.dominantTrait}">${item.record.dominantTrait}</span>
        </div>
        <p>${item.record.narrative?.trend || 'Trajectory updated.'}</p>
        <small>${formatTimestamp(item.record.timestamp)}</small>
      </div>
    `)
    .join('');
  container.innerHTML = entries;
}

function renderGrowthSignals(container, dnaIndex) {
  if (!container) return;
  if (!dnaIndex.size) {
    container.innerHTML = '<p class="empty-state">Growth intelligence will show up after the first vibe runs.</p>';
    return;
  }
  const growthCounts = {};
  const boosterCounts = {};
  dnaIndex.forEach(bucket => {
    bucket.records.forEach(record => {
      const target = record.growthEdge?.target || 'balanced';
      growthCounts[target] = (growthCounts[target] || 0) + 1;
      (record.boosters || []).forEach(tip => {
        boosterCounts[tip] = (boosterCounts[tip] || 0) + 1;
      });
    });
  });

  const growthList = formatCountMap(growthCounts, 'edge');
  const boosterList = formatCountMap(boosterCounts, 'play');

  container.innerHTML = `
    <div class="dna-growth-grid">
      <div>
        <h5>Most requested growth edges</h5>
        <ul>${growthList}</ul>
      </div>
      <div>
        <h5>Most recommended boosters</h5>
        <ul>${boosterList}</ul>
      </div>
    </div>
  `;
}

function wireBroadcast(button, input) {
  if (!button || !input) return;
  if (button.dataset.bound === 'true') return;
  button.dataset.bound = 'true';
  button.addEventListener('click', async () => {
    const message = input.value.trim();
    if (!message) {
      showToast('Enter an announcement message');
      return;
    }
    const notification = {
      id: Date.now().toString(),
      message,
      timestamp: Date.now()
    };
    try {
      await IDB.batchSet('notifications', [notification]);
    } catch (err) {
      console.warn('Notification cache failed', err);
    }
    try {
      if (window.firebase && window.firebase.database) {
        await window.firebase.database().ref('notifications/' + notification.id).set(notification);
      }
    } catch (err) {
      console.warn('Notification broadcast sync failed', err);
    }
    input.value = '';
    showToast('Announcement broadcasted');
    logActivity('boss-view:broadcast', { length: message.length });
  });
}

function averageDominantScore(dnaIndex) {
  const scores = [];
  dnaIndex.forEach(bucket => {
    const latest = bucket.records[0];
    if (latest && typeof latest.vibeScore === 'number') {
      scores.push(latest.vibeScore);
    }
  });
  if (!scores.length) return 0;
  const avg = scores.reduce((acc, val) => acc + val, 0) / scores.length;
  return Math.round(avg * 10) / 10;
}

function formatTrait(trait, score) {
  if (!trait) return '—';
  const percent = typeof score === 'number' ? `${score}%` : '';
  return `${trait} ${percent}`.trim();
}

function formatTopK(map) {
  const sorted = Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => `${name} (${count})`);
  return sorted.length ? sorted.join(', ') : 'no creators yet';
}

function formatCountMap(counts, noun) {
  const entries = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, count]) => `<li><span>${label}</span><strong>${count} ${noun}${count === 1 ? '' : 's'}</strong></li>`);
  return entries.join('') || '<li>No data yet</li>';
}

function buildUserIndex(users = []) {
  const map = new Map();
  users.forEach(user => {
    const key = sanitizeKey(user.email || user.id);
    if (key) map.set(key, user);
  });
  return map;
}

function sanitizeKey(value) {
  return (value || '').toString().toLowerCase().replace(/[^a-z0-9_-]/g, '');
}

function formatTimestamp(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}
