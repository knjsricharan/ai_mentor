// Firebase configuration
// Replace these with your actual Firebase config values
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDg-MREq61oz1065HB8T305vyg-Xra_geA",
  authDomain: "cerebro-backend-f8688.firebaseapp.com",
  projectId: "cerebro-backend-f8688",
  storageBucket: "cerebro-backend-f8688.firebasestorage.app",
  messagingSenderId: "1091672362578",
  appId: "1:1091672362578:web:3357dc5a33981881c5198b",
  measurementId: "G-0FZFJ7FPZM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;

