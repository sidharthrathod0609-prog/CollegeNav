import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';
import { getAuth, type Auth } from 'firebase/auth';

/**
 * Firebase Realtime Database Configuration
 * Environment-based configuration loaded safely from import.meta.env
 * NOTE: Service-account private keys and credentials must NEVER be placed in frontend code.
 */

// Safe environment access supporting both Vite (import.meta.env) and Node test runners
const globalObj = typeof globalThis !== 'undefined' ? (globalThis as any) : {};
const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) 
  ? (import.meta as any).env 
  : (globalObj.process && globalObj.process.env) 
  ? globalObj.process.env 
  : {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: env.VITE_FIREBASE_DATABASE_URL || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || '',
};

const isExplicitOffline = env.VITE_FORCE_OFFLINE_FALLBACK === 'true';

let appInstance: FirebaseApp | null = null;
let databaseInstance: Database | null = null;
let authInstance: Auth | null = null;
let initializationError: string | null = null;

/**
 * Checks whether valid Firebase configuration parameters are provided
 */
export function isFirebaseConfigured(): boolean {
  if (isExplicitOffline) return false;
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.databaseURL
  );
}

/**
 * Safely initializes and returns the Firebase app instance
 */
export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null;

  try {
    if (!appInstance) {
      const existingApps = getApps();
      if (existingApps.length > 0) {
        appInstance = existingApps[0];
      } else {
        appInstance = initializeApp(firebaseConfig);
      }
    }
    return appInstance;
  } catch (err: any) {
    initializationError = err?.message || 'Failed to initialize Firebase app';
    console.warn('[Firebase] Initialization error, falling back to local verified storage:', initializationError);
    return null;
  }
}

/**
 * Safely returns the Firebase Realtime Database instance
 */
export function getFirebaseDatabase(): Database | null {
  const app = getFirebaseApp();
  if (!app) return null;

  try {
    if (!databaseInstance) {
      databaseInstance = getDatabase(app);
    }
    return databaseInstance;
  } catch (err: any) {
    console.warn('[Firebase RTDB] Database connection error:', err?.message);
    return null;
  }
}

/**
 * Safely returns Firebase Auth instance
 */
export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  if (!app) return null;

  try {
    if (!authInstance) {
      authInstance = getAuth(app);
    }
    return authInstance;
  } catch (err: any) {
    console.warn('[Firebase Auth] Auth instance error:', err?.message);
    return null;
  }
}

/**
 * Returns diagnostic connection summary for administration and debugging
 */
export function getFirebaseConnectionDiagnostics() {
  const isConfigured = isFirebaseConfigured();
  return {
    isConfigured,
    isExplicitOffline,
    databaseURL: firebaseConfig.databaseURL ? firebaseConfig.databaseURL.replace(/:\/\/.*@/, '://') : 'Not Configured (Using Local Fallback)',
    projectId: firebaseConfig.projectId || 'None',
    hasApiKey: Boolean(firebaseConfig.apiKey),
    initializationError,
    status: isConfigured ? 'CONNECTED_OR_READY' : 'OFFLINE_VERIFIED_FALLBACK',
  };
}
