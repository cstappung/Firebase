// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBmPHx4Mx93qGhxQjTMLlaxXLpT7qnzCIA",
  authDomain: "eggspress-dashboard.firebaseapp.com",
  databaseURL: "https://eggspress-dashboard-default-rtdb.firebaseio.com",
  projectId: "eggspress-dashboard",
  storageBucket: "eggspress-dashboard.appspot.com",
  messagingSenderId: "143399582366",
  appId: "1:143399582366:web:98d8ca53366bc65c7fd98f",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// Añadimos esto para autenticar anónimamente al arrancar:
const auth = getAuth(app);
signInAnonymously(auth).catch((err) => {
  console.error("Error en auth anónima:", err);
});