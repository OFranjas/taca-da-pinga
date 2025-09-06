import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const env = (key, fallback) => {
  // Prefer Vite envs, fallback to CRA envs for transition compatibility
  const viteKey = `VITE_${key}`;
  const craKey = `REACT_APP_${key}`;
  const proc =
    typeof globalThis !== 'undefined' && typeof globalThis.process !== 'undefined'
      ? globalThis.process
      : undefined;
  const viteVal =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[viteKey]) ||
    (proc && proc.env && proc.env[viteKey]);
  const craVal = proc && proc.env && proc.env[craKey];
  return viteVal ?? craVal ?? fallback;
};

const firebaseConfig = {
  apiKey: env('FIREBASE_API_KEY'),
  authDomain: env('FIREBASE_AUTH_DOMAIN'),
  projectId: env('FIREBASE_PROJECT_ID'),
  storageBucket: env('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: env('FIREBASE_MESSAGING_SENDER_ID'),
  appId: env('FIREBASE_APP_ID'),
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
