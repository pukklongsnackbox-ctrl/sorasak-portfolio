import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDp75akZU52y5MNRx9j1gCxH0g3wyB9VmE",
  authDomain: "sorasak-portfolio.firebaseapp.com",
  projectId: "sorasak-portfolio",
  storageBucket: "sorasak-portfolio.firebasestorage.app",
  messagingSenderId: "895524772330",
  appId: "1:895524772330:web:c48843fd0098ef54e83a93"
};

// Initialize Firebase and export services
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);