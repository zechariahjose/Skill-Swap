import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Platform } from 'react-native';

// ==============================
// Firebase Config (.env values)
// ==============================

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

// Check if Firebase is configured
export const isFirebaseConfigured =
  Object.values(firebaseConfig).every(Boolean);

if (!isFirebaseConfigured) {
  console.warn(
    'Firebase is not configured. App running in demo mode.'
  );
}

// ==============================
// Initialize Firebase App
// ==============================

let app: FirebaseApp | null = null;

if (isFirebaseConfigured) {
  app =
    getApps().length === 0
      ? initializeApp(firebaseConfig)
      : getApps()[0];
}

// ==============================
// Initialize Auth (Expo-safe)
// ==============================

let _auth: Auth | null = null;
let _authInitAttempted = false;

function initAuth() {
  if (!app || _auth || _authInitAttempted) return;
  _authInitAttempted = true;

  if (Platform.OS === 'web') {
    _auth = getAuth(app);
    return;
  }

  _auth = getAuth(app);
}

export const getAuthInstance = (): Auth | null => {
  initAuth();
  return _auth;
};

// ==============================
// Firestore
// ==============================

export const db: Firestore | null = app
  ? getFirestore(app)
  : null;

export default app;