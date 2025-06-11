// firebase/firebase.js
import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBYVvH_7578ixzf67tg5xTAFoYUZ9uilSc",
  authDomain: "basta-online-a9e3f.firebaseapp.com",
  databaseURL: "https://basta-online-a9e3f-default-rtdb.firebaseio.com",
  projectId: "basta-online-a9e3f",
  storageBucket: "basta-online-a9e3f.firebasestorage.app",
  messagingSenderId: "909267448937",
  appId: "1:909267448937:web:45fcca29b4f3bec5455ef8",
  measurementId: "G-0XG4H7T82K",
};

// Evitar inicializar más de una vez
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Obtener instancia de base de datos en tiempo real
const database = getDatabase(app);

export { database };
