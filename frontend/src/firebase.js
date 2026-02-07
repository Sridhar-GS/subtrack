import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: 'subtrack-webapp.firebasestorage.app',
  messagingSenderId: '356404471',
  appId: '1:356404471:web:f3e8f5724ba436f52e97f2',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
