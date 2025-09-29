import { initializeApp } from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';
import * as firestore from 'firebase/firestore';
import { createMockFirestore } from './firebase-mock';

let db, auth, lib;

if (import.meta.env.VITE_USE_MOCK_DB === 'true') {
  console.log("Using Mock Firestore");
  const mock = createMockFirestore();
  db = mock.db;
  lib = mock; // Use the mock library
  // A simple mock for auth for now
  auth = {
    onAuthStateChanged: (callback) => {
      // Immediately call with a mock user
      const mockUser = { uid: 'mock-user-uid', isAnonymous: true };
      callback(mockUser);
      return () => {}; // Return an unsubscribe function
    },
    signInAnonymously: () => Promise.resolve({ user: { uid: 'mock-user-uid', isAnonymous: true } }),
    getAuth: () => auth, // Return the mock auth object
  };
} else {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  const app = initializeApp(firebaseConfig);
  db = firestore.getFirestore(app);
  auth = firebaseAuth.getAuth(app);
  lib = { ...firestore, ...firebaseAuth }; // Combine real libraries
}

export { db, auth, lib };