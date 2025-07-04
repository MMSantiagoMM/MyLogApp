
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // If you plan to use Firebase Authentication
// import { getStorage } from 'firebase/storage'; // If you plan to use Firebase Storage

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
  // Check for placeholder values
  const isConfigValid = firebaseConfig.apiKey && 
                        firebaseConfig.projectId && 
                        !firebaseConfig.apiKey.includes('YOUR_') && 
                        !firebaseConfig.projectId.includes('YOUR_');
  
  if (isConfigValid) {
    console.log("[firebase.ts] Initializing Firebase app with projectId:", firebaseConfig.projectId);
    app = initializeApp(firebaseConfig);
  } else {
    console.error(
      "[firebase.ts] CRITICAL ERROR: Firebase configuration is missing or contains placeholder values. " +
      "Please check your .env file and ensure all NEXT_PUBLIC_FIREBASE_* variables are correctly set with your actual project credentials. " +
      "You MUST restart your Next.js development server after modifying the .env file."
    );
  }
} else {
  app = getApp();
  console.log("[firebase.ts] Using existing Firebase app for projectId:", getApp().options.projectId);
}

let db;
let auth;
if (app) {
  db = getFirestore(app);
  auth = getAuth(app);
} else {
  // Fallback or error handling for db if app didn't initialize
  console.error(
    "[firebase.ts] Firebase app failed to initialize. Firestore and Auth will not be available. " +
    "Review previous error messages for missing Firebase configuration."
  );
}

// const storage = getStorage(app); // If using storage

export { app, db, auth };
