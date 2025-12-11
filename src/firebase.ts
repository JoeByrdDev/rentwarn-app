import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  // signInWithRedirect,  // optional alternative
} from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyC7-YX_z-egTlc9ImTvGbitrR7SQhBJsUg",
  authDomain: "rentwarn-394dc.firebaseapp.com",
  projectId: "rentwarn-394dc",
  storageBucket: "rentwarn-394dc.firebasestorage.app",
  messagingSenderId: "1038508813376",
  appId: "1:1038508813376:web:49bad2c8e5269d69e003a5",
  measurementId: "G-4VBVC0DYKQ"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const auth = getAuth(app);

// 🔹 Add Google provider
const googleProvider = new GoogleAuthProvider();

// Optional: force account-picker every time
googleProvider.setCustomParameters({
  prompt: "select_account",
});

// 🔹 Export a helper you can call from React components
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  // You can inspect result.user here if needed
  return result;
}