console.log("App.js loaded");
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, onSnapshot,
  query, orderBy, getDocs, doc, setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCC2RQ6EzqvK5NDmn5cqeaPTN50SP9dhWc",
  authDomain: "chatly-859d4.firebaseapp.com",
  projectId: "chatly-859d4",
  storageBucket: "chatly-859d4.firebasestorage.app",
  messagingSenderId: "789971075837",
  appId: "1:789971075837:web:8d6328b14136565588b494"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentRoom = "general";
let lastMessageTime = 0;

const authScreen = document.getElementById("authScreen");
const appScreen = document.getElementById("app");
const roomList = document.getElementById("roomList");
const messagesDiv = document.getElementById("messages");

document.getElementById("loginBtn").addEventListener("click", async () => {
  const emailInput = document.getElementById("email").value;
  const passwordInput = document.getElementById("password").value;

  if (!emailInput || !passwordInput) {
    alert("Please enter email and password.");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, emailInput, passwordInput);
  } catch (error) {
    try {
      await createUserWithEmailAndPassword(auth, emailInput, passwordInput);
    } catch (err) {
      alert(err.message);
    }
  }
});

document.getElementById("logoutBtn").onclick = () => signOut(auth);

onAuthStateChanged(auth, user => {
  if (user) {
    authScreen.classList.add("hidden");
    appScreen.classList.remove("hidden");
    loadRooms();
    loadRoom("general");
  } else {
    authScreen.classList.remove("hidden");
    appScreen.classList.add("hidden");
  }
});

async function loadRooms() {
  const snapshot = await getDocs(collection(db, "rooms"));
  roomList.innerHTML = "";

  snapshot.forEach(docSnap => {
    const li = document.createElement("li");
    li.textContent = docSnap.id;
    li.onclick = () => loadRoom(docSnap.id);
    roomList.appendChild(li);
  });
}

document.getElementById("createRoomBtn").onclick = async () => {
  const name = prompt("Room name:");
  if (!name) return;
  await setDoc(doc(db, "rooms", name), { created: Date.now() });
  loadRooms();
};

function loadRoom(roomName) {
  currentRoom = roomName;
  messagesDiv.innerHTML = "";

  const q = query(
    collection(db, "rooms", roomName, "messages"),
    orderBy("timestamp")
  );

  onSnapshot(q, snapshot => {
    messagesDiv.innerHTML = "";
    snapshot.forEach(doc => {
      const msg = doc.data();
      const div = document.createElement("div");
      div.classList.add("message");
      div.innerHTML = `<strong>${msg.user}</strong>: ${msg.text}`;
      messagesDiv.appendChild(div);
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}

document.getElementById("sendBtn").onclick = sendMessage;

async function sendMessage() {
  const now = Date.now();
  if (now - lastMessageTime < 1000) return;
  lastMessageTime = now;

  const input = document.getElementById("messageInput");
  const text = input.value.trim();
  if (!text) return;

  await addDoc(collection(db, "rooms", currentRoom, "messages"), {
    user: auth.currentUser.email,
    text,
    timestamp: now
  });

  input.value = "";
}
