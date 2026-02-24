import {
  GithubAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

import {
  ref as dbRef,
  set,
  onDisconnect,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";

import { auth, rtdb } from "./firebase-config.js";

// ── Providers ──────────────────────────────────────────────────────────────
const githubProvider    = new GithubAuthProvider();
const googleProvider    = new GoogleAuthProvider();
const microsoftProvider = new OAuthProvider("microsoft.com");

microsoftProvider.setCustomParameters({ prompt: "select_account" });
googleProvider.setCustomParameters({ prompt: "select_account" });

// ── Sign-in helpers ────────────────────────────────────────────────────────
async function signInWith(provider) {
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    // user closed popup or misconfiguration
    throw new Error(friendlyAuthError(e.code));
  }
}

export const signInWithGitHub    = () => signInWith(githubProvider);
export const signInWithGoogle    = () => signInWith(googleProvider);
export const signInWithMicrosoft = () => signInWith(microsoftProvider);

export async function signOut() {
  const user = auth.currentUser;
  if (user) {
    // Mark offline before leaving
    await set(dbRef(rtdb, `presence/${user.uid}`), null);
  }
  await fbSignOut(auth);
}

// ── Presence ───────────────────────────────────────────────────────────────
export function setupPresence(user) {
  const presRef = dbRef(rtdb, `presence/${user.uid}`);
  const data = {
    uid:         user.uid,
    displayName: user.displayName || user.email?.split("@")[0] || "User",
    photoURL:    user.photoURL   || "",
    online:      true,
    lastSeen:    serverTimestamp()
  };
  set(presRef, data);
  onDisconnect(presRef).set({ ...data, online: false, lastSeen: serverTimestamp() });
}

// ── Auth state observable ──────────────────────────────────────────────────
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// ── Error messages ─────────────────────────────────────────────────────────
function friendlyAuthError(code) {
  const map = {
    "auth/popup-closed-by-user":    "Sign-in popup was closed.",
    "auth/cancelled-popup-request": "Another sign-in is already in progress.",
    "auth/account-exists-with-different-credential":
      "An account already exists with this email using a different provider.",
    "auth/popup-blocked":
      "Popup was blocked. Please allow popups for this site."
  };
  return map[code] || `Sign-in failed (${code})`;
}
