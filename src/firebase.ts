import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC7-YX_z-egTlc9ImTvGbitrR7SQhBJsUg",
  authDomain: "rentwarn-394dc.firebaseapp.com",
  projectId: "rentwarn-394dc",
  storageBucket: "rentwarn-394dc.firebasestorage.app",
  messagingSenderId: "1038508813376",
  appId: "1:1038508813376:web:49bad2c8e5269d69e003a5",
  measurementId: "G-4VBVC0DYKQ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
