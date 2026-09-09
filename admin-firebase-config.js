/* ══════════════════════════════════════════════════════
   ADMIN FIREBASE CONFIG — Lil' Cocolates
   Separate from the customer-facing firebase-config.js
   because this page also needs Auth + live order queries.
══════════════════════════════════════════════════════ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import {
  getAuth,
  setPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCaBAmk0ASHfVPr7uPQpxXNok228JAGBRE",
  authDomain: "lil-cocolates-d5b5f.firebaseapp.com",
  databaseURL: "https://lil-cocolates-d5b5f-default-rtdb.firebaseio.com",
  projectId: "lil-cocolates-d5b5f",
  storageBucket: "lil-cocolates-d5b5f.firebasestorage.app",
  messagingSenderId: "267236978702",
  appId: "1:267236978702:web:ce8dfd8d8bb64bfd470c5f",
  measurementId: "G-BZ126VNTHN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
setPersistence(auth, browserSessionPersistence); // logs out when the browser is fully closed

/* admin.js is a plain (non-module) script — expose what it needs on window */
window.firebaseDb = db;
window.firebaseAuth = auth;
window.firebaseUtils = {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
};