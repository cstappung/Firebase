// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// IMPORTANT: Replace with your own Firebase project configuration.
const firebaseConfig = {
  apiKey: "AIzaSyBb-a97yzK1G1zu7DgD-tYwUqgAvwn8exg",
  authDomain: "egg-counter-dashboard.firebaseapp.com",
  databaseURL: "egg-counter-dashboard-default-rtdb.firebaseio.com",
  projectId: "egg-counter-dashboard",
  storageBucket: "egg-counter-dashboard.appspot.com",
  messagingSenderId: "105476697823",
  appId: "1:143399582366:web:98d8ca53366bc65c7fd98f",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const database = getDatabase(app);

export { app, database };
