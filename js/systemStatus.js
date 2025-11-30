import { IDB } from './utils.js';
import { auth } from './firebaseConfig.js';

const listeners = new Set();
let pulseHandle = null;
let boundEmit = null;
const PULSE_INTERVAL = 10000;

export async function collectSystemStatus() {
  const results = [];
  results.push(checkConnectivity());
  results.push(await checkServiceWorker());
  results.push(checkAuthentication());
  results.push(checkSession());
  const storageStatus = await checkStorage();
  if (storageStatus) results.push(storageStatus);
  const backlogStatus = await checkSupportBacklog();
  if (backlogStatus) results.push(backlogStatus);
  return results;
}

export async function startSystemPulse(interval = PULSE_INTERVAL) {
  if (pulseHandle) return;
  const emit = async () => {
    const snapshot = await collectSystemStatus();
    listeners.forEach(listener => {
      try { listener(snapshot); } catch (err) { console.warn('Status listener error', err); }
    });
  };
  await emit();
  pulseHandle = setInterval(emit, interval);
  boundEmit = emit;
  window.addEventListener('online', boundEmit);
  window.addEventListener('offline', boundEmit);
}

export function stopSystemPulse() {
  if (!pulseHandle) return;
  clearInterval(pulseHandle);
  pulseHandle = null;
  if (boundEmit) {
    window.removeEventListener('online', boundEmit);
    window.removeEventListener('offline', boundEmit);
    boundEmit = null;
  }
}

export function onSystemStatusUpdate(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function checkConnectivity() {
  return {
    label: 'Connectivity',
    value: navigator.onLine ? 'Online' : 'Offline',
    severity: navigator.onLine ? 'ok' : 'warn',
    detail: navigator.onLine ? 'Network healthy' : 'Check your internet connection'
  };
}

async function checkServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return {
      label: 'Service Worker',
      value: 'Unsupported',
      severity: 'warn',
      detail: 'Browser does not support offline mode'
    };
  }
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return {
        label: 'Service Worker',
        value: 'Not registered',
        severity: 'info',
        detail: 'Offline caching not yet active'
      };
    }
    const state = registration.active ? 'Active' : registration.waiting ? 'Update ready' : registration.installing ? 'Installing' : 'Idle';
    return {
      label: 'Service Worker',
      value: state,
      severity: registration.active ? 'ok' : 'info',
      detail: registration.scope || 'background agent'
    };
  } catch (error) {
    return {
      label: 'Service Worker',
      value: 'Error',
      severity: 'warn',
      detail: error.message || 'Unable to inspect service worker'
    };
  }
}

function checkAuthentication() {
  const user = auth?.currentUser;
  return {
    label: 'Authentication',
    value: user ? 'Verified' : 'Guest',
    severity: user ? 'ok' : 'warn',
    detail: user ? user.email || user.uid : 'Sign in to unlock collaboration'
  };
}

function checkSession() {
  const sessionId = localStorage.getItem('currentSession');
  return {
    label: 'Session',
    value: sessionId ? 'Active' : 'Missing',
    severity: sessionId ? 'info' : 'warn',
    detail: sessionId ? `Session #${sessionId.slice(-6)}` : 'Generate or join an instance code'
  };
}

async function checkStorage() {
  try {
    if (!navigator.storage?.estimate) return null;
    const { quota = 0, usage = 0 } = await navigator.storage.estimate();
    if (!quota) return null;
    const usagePercent = Math.round((usage / quota) * 100);
    return {
      label: 'Storage',
      value: `${usagePercent}% used`,
      severity: usagePercent < 80 ? 'ok' : usagePercent < 95 ? 'warn' : 'danger',
      detail: `${formatBytes(usage)} of ${formatBytes(quota)}`
    };
  } catch (error) {
    return {
      label: 'Storage',
      value: 'Unknown',
      severity: 'info',
      detail: error.message || 'Cannot read storage usage'
    };
  }
}

async function checkSupportBacklog() {
  try {
    const tickets = await IDB.getAll('support');
    if (!tickets?.length) {
      return {
        label: 'Support Queue',
        value: 'Clear',
        severity: 'ok',
        detail: 'No open tickets'
      };
    }
    const recent = tickets.filter(ticket => Date.now() - ticket.timestamp < 86400000).length;
    return {
      label: 'Support Queue',
      value: `${tickets.length} open`,
      severity: tickets.length < 5 ? 'info' : 'warn',
      detail: `${recent} arrived in the last 24h`
    };
  } catch (error) {
    return {
      label: 'Support Queue',
      value: 'Unknown',
      severity: 'info',
      detail: error.message || 'Cannot read support backlog'
    };
  }
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[exponent]}`;
}
