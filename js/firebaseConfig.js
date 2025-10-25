// Central Firebase configuration and helper exports using modular SDK
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, update, push, remove, onValue, get } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

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

export function database() { return db; }
export function dbRef(path) { return ref(db, path); }
export { set, update, push, remove, onValue, get };
export { auth, analytics, app };

export default { app, db, auth, analytics };
