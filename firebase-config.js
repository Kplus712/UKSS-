// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getDatabase, ref, set, get, push, onValue, remove } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAIabK86PrfHfzNVciI2K7aRjb8VoWyA7A",
  authDomain: "ukss-voting-system.firebaseapp.com",
  databaseURL: "https://ukss-voting-system-default-rtdb.firebaseio.com",
  projectId: "ukss-voting-system",
  storageBucket: "ukss-voting-system.firebasestorage.app",
  messagingSenderId: "525528255065",
  appId: "1:525528255065:web:97c4e55d2984acc718bf48",
  measurementId: "G-14ZV9E3X7C"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export { ref, set, get, push, onValue, remove };
