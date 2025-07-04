
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// =================================================================================
// IMPORTANT: PASTE YOUR FIREBASE CONFIGURATION HERE
// =================================================================================
// To fix the "auth/api-key-not-valid" error, you must replace the placeholder
// values below with the actual configuration object from your Firebase project.
//
// How to get your config:
// 1. Go to the Firebase Console -> Project Settings (gear icon).
// 2. In the "General" tab, scroll down to the "Your apps" section.
// 3. Find your web app and click on "SDK setup and configuration".
// 4. Select the "Config" option.
// 5. Copy the entire `firebaseConfig` object and paste it here, replacing the
//    one below.
//
// After pasting your config, SAVE the file. The development server will
// automatically reload, and the error should be resolved.
// =================================================================================
const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY_HERE",
  authDomain: "PASTE_YOUR_AUTH_DOMAIN_HERE",
  projectId: "PASTE_YOUR_PROJECT_ID_HERE",
  storageBucket: "PAST_YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: "PASTE_YOUR_MESSAGING_SENDER_ID_HERE",
  appId: "PASTE_YOUR_APP_ID_HERE",
};

// Initialize Firebase
let app;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.error("[firebase.ts] Firebase initialization failed.", error);
    // If you see an error here, it's likely due to the firebaseConfig object being incorrect.
  }
} else {
  app = getApp();
}

let db;
let auth;

if (app) {
  db = getFirestore(app);
  auth = getAuth(app);
} else {
    console.error(
    "[firebase.ts] Firebase app is not available. Firestore and Auth will not be available."
  );
}

export { app, db, auth };
