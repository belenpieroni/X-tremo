// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Config
const firebaseConfig = {
  apiKey: "AIzaSyAtOYfd8Y2iaSmCob5bEtqW9_5C_nDkqgg",
  authDomain: "x-tremo.firebaseapp.com",
  projectId: "x-tremo",
  storageBucket: "x-tremo.appspot.com", 
  messagingSenderId: "775394438169",
  appId: "1:775394438169:web:a27832deabc26bd15c4e88",
  databaseURL: "https://x-tremo-default-rtdb.firebaseio.com"
};

// Inicialización
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db };