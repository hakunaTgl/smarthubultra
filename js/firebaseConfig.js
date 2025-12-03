// Central Firebase configuration and helper exports using modular SDK
import { initializeApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  update,
  push,
  remove,
  onValue,
  get,
  onChildAdded,
  onChildChanged,
  onChildRemoved
} from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyAPPllpKiFOcjqxnuk2tRvithFYKSzkQAc",
  authDomain: "smarthubultra.firebaseapp.com",
  databaseURL: "https://smarthubultra-default-rtdb.firebaseio.com",
  projectId: "smarthubultra",
  storageBucket: "smarthubultra.firebasestorage.app",
  messagingSenderId: "12039705608",
  appId: "1:12039705608:web:f1a4383b245275eaa26dbd",
  measurementId: "G-V24P3DHL9M"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
let analytics;
try { analytics = getAnalytics(app); } catch (e) { /* optional */ }

const FUNCTIONS_REGION = 'us-central1';
const functions = getFunctions(app, FUNCTIONS_REGION);

if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  try {
    connectFunctionsEmulator(functions, 'localhost', 5001);
  } catch (err) {
    console.warn('Functions emulator connection failed', err);
  }
}

const FUNCTIONS_BASE_URL = (typeof window !== 'undefined' && window.SMART_HUB_FUNCTIONS_URL) || `https://${FUNCTIONS_REGION}-${firebaseConfig.projectId}.cloudfunctions.net`;

export function database() { return db; }
export function dbRef(path) { return ref(db, path); }
export { set, update, push, remove, onValue, onChildAdded, onChildChanged, onChildRemoved, get };
export { auth, analytics, app, functions, httpsCallable, FUNCTIONS_BASE_URL };

export default { app, db, auth, analytics };
