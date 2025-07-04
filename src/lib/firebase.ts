
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; 

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let app;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    console.log("[firebase.ts] Initializing Firebase app with projectId:", firebaseConfig.projectId);
  } catch (error) {
    console.error("[firebase.ts] Firebase initialization failed. This is often due to missing or invalid configuration in your .env file.", error);
  }
} else {
  app = getApp();
}

let db;
let auth;

// Only try to get db and auth if the app was successfully initialized.
if (app) {
  db = getFirestore(app);
  auth = getAuth(app);
} else {
    console.error(
    "[firebase.ts] Firebase app is not available. Firestore and Auth will not be available. " +
    "Please check your .env file for correct Firebase credentials and restart the server."
  );
}

export { app, db, auth };
