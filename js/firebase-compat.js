/*
  Minimal compatibility shim that exposes a `window.firebase` object
  implemented with the modular Firebase v9 APIs. This is an incremental
  compatibility layer so legacy code using `firebase.database().ref(...).set(...)`
  can continue to work while we migrate modules to the modular API.

  NOTE: This is intentionally small — it implements the subset of database
  operations used by the current codebase: ref(...).set, update, remove, push,
  on('child_added'|'value', cb), once('value') (via get).
*/
import { initializeApp } from 'firebase/app';
import {
  getDatabase,
  ref as dbRef,
  set as dbSet,
  update as dbUpdate,
  remove as dbRemove,
  push as dbPush,
  onValue,
  onChildAdded,
  get as dbGet
} from 'firebase/database';

// Reuse same config as other modules. Keep in sync if you change.
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

function makeRef(path) {
  const ref = dbRef(db, path);
  return {
    set: (val) => dbSet(ref, val),
    update: (val) => dbUpdate(ref, val),
    remove: () => dbRemove(ref),
    push: (val) => dbPush(ref, val),
    on: (event, cb) => {
      if (event === 'child_added') {
        return onChildAdded(ref, snapshot => cb(snapshot));
      }
      if (event === 'value') {
        return onValue(ref, snapshot => cb(snapshot));
      }
      // Unknown event: fallback to value
      return onValue(ref, snapshot => cb(snapshot));
    },
    once: async (event) => {
      if (event === 'value') {
        return dbGet(ref);
      }
      return dbGet(ref);
    }
  };
}

// Minimal database accessor shape used in legacy code
const compat = {
  database: () => ({
    ref: (path) => makeRef(path)
  })
};

// Attach to window for legacy modules that expect a global `firebase` object
if (typeof window !== 'undefined') {
  window.firebase = compat;
}

export default compat;
