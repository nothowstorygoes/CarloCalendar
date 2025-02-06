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
  apiKey: process.env.GOOGLEAPIKEY,
  authDomain: process.env.GOOGLEAUTHDOMAIN,
  projectId: process.env.GOOGLEPROJECTID,
  storageBucket: process.env.GOOGLESTORAGEBUCKET,
  messagingSenderId: process.env.GOOGLEMESSAGINGSENDERID,
  appId: process.env.GOOGLEAPPID,
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
