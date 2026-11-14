import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAUb-dPemGDuGD3u7YLvMcFRe0cVtcBpT0',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'minesquiz-4a688.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'minesquiz-4a688',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'minesquiz-4a688.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '493391143033',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:493391143033:web:b0cd9078133a842bf574a8',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-02BFQ0FX67',
};

// Initialize Firebase safely
export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let authInstance: any = null;
try {
  authInstance = getAuth(firebaseApp);
} catch (err) {
  console.warn('[Firebase Auth] Initialization deferred:', err);
}

export const auth = authInstance;
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Safe Auth Helpers
export const signInWithGoogle = async () => {
  if (!auth) throw new Error('Firebase Auth is not initialized');
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (err: any) {
    if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
      console.warn('[Firebase Auth] Popup closed or cancelled by user.');
    }
    throw err;
  }
};

export const signInWithEmail = async (email: string, pass: string) => {
  if (!auth) throw new Error('Firebase Auth is not initialized');
  return await signInWithEmailAndPassword(auth, email, pass);
};

export const signUpWithEmail = async (email: string, pass: string) => {
  if (!auth) throw new Error('Firebase Auth is not initialized');
  return await createUserWithEmailAndPassword(auth, email, pass);
};

export const signOutUser = async () => {
  if (!auth) return;
  return await signOut(auth);
};

export { onAuthStateChanged };
export type { FirebaseUser };
