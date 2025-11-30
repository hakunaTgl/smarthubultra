/**
 * Firebase Configuration Module
 * 
 * Centralizes Firebase initialization and exports Firebase instances
 * for use throughout the application.
 * 
 * @module firebaseConfig
 */
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

/**
 * Firebase configuration object with environment-based credentials.
 * @type {import('firebase/app').FirebaseOptions}
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

/**
 * The initialized Firebase app instance.
 * @type {import('firebase/app').FirebaseApp}
 */
const app = initializeApp(firebaseConfig);

/**
 * The Firebase analytics instance.
 * @type {import('firebase/analytics').Analytics}
 */
const analytics = getAnalytics(app);

export { app, analytics, firebaseConfig };
