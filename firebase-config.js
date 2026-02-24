import { initializeApp }    from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth }           from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getDatabase }       from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";
import { getFirestore }      from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { getStorage }        from "https://www.gstatic.com/firebasejs/11.1.0/firebase-storage.js";

const firebaseConfig = {
  apiKey:            "AIzaSyCC2RQ6EzqvK5NDmn5cqeaPTN50SP9dhWc",
  authDomain:        "chatly-859d4.firebaseapp.com",
  // Enable Realtime Database in your Firebase console first:
  // https://console.firebase.google.com → Build → Realtime Database → Create database
  databaseURL:       "https://chatly-859d4-default-rtdb.firebaseio.com",
  projectId:         "chatly-859d4",
  storageBucket:     "chatly-859d4.firebasestorage.app",
  messagingSenderId: "789971075837",
  appId:             "1:789971075837:web:8d6328b14136565588b494"
};

const app       = initializeApp(firebaseConfig);
export const auth      = getAuth(app);
export const rtdb      = getDatabase(app);        // Realtime Database  → live messages
export const firestore = getFirestore(app);       // Firestore          → channels / servers
export const storage   = getStorage(app);         // Storage            → file uploads
