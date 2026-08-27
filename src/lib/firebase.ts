import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

/**
 * Firebase configuration is read from public env vars (see `.env.local.example`).
 * The dashboard renders from bundled sample data until these are provided, so the
 * app works out of the box and switches to Firestore the moment you wire it up.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId,
);

let cachedApp: FirebaseApp | undefined;
let cachedDb: Firestore | undefined;
let cachedAuth: Auth | undefined;

/** Google provider, always requesting account selection. */
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export function getFirebaseApp(): FirebaseApp | undefined {
  if (!isFirebaseConfigured) return undefined;
  if (!cachedApp) {
    cachedApp = getApps().length
      ? getApp()
      : initializeApp(firebaseConfig as Required<typeof firebaseConfig>);
  }
  return cachedApp;
}

export function getDb(): Firestore | undefined {
  if (!isFirebaseConfigured) return undefined;
  if (!cachedDb) {
    const app = getFirebaseApp();
    if (app) cachedDb = getFirestore(app);
  }
  return cachedDb;
}

export function getFirebaseAuth(): Auth | undefined {
  if (!isFirebaseConfigured) return undefined;
  if (!cachedAuth) {
    const app = getFirebaseApp();
    if (app) cachedAuth = getAuth(app);
  }
  return cachedAuth;
}
