// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCaapVIqoXyVJ7wmPKk1tVNHU8RyfVudFk",
  authDomain: "carlocalendar-57d0c.firebaseapp.com",
  projectId: "carlocalendar-57d0c",
  storageBucket: "carlocalendar-57d0c.firebasestorage.app",
  messagingSenderId: "232893346537",
  appId: "1:232893346537:web:d16cb4585ccdd3a4037678",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Set persistence to local
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    // Existing and future Auth states are now persisted in the current
    // session only. Closing the window would clear any existing state even
    // if a user forgets to sign out.
    // ...
  })
  .catch((error) => {
    // Handle Errors here.
    const errorCode = error.code;
    const errorMessage = error.message;
  });

// Initialize Firebase

export const googleProvider = new GoogleAuthProvider();
