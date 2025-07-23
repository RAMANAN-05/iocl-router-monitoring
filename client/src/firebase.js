// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// ✅ Your actual config (double-check spelling and keys)
const firebaseConfig = {
  apiKey: "AIzaSyB4iNunNSnDdkKqSdsMai5wor3qpXL0HEk",
  authDomain: "network-status-dbd99.firebaseapp.com",
  projectId: "network-status-dbd99",
  storageBucket: "network-status-dbd99.appspot.com", // ✅ corrected "firebasestorage.app"
  messagingSenderId: "249747340154",
  appId: "1:249747340154:web:f2ed3ffc51e45b614574c3",
  measurementId: "G-NXJPDK9Z9Z"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Export auth and provider AFTER app is initialized
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
