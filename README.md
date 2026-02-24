# 💬 Chatly

A Discord-style real-time chat app built with Firebase and vanilla JS ES modules.

---

## File Structure

```
chatly/
├── index.html          ← App shell + login screen
├── style.css           ← All styles
├── firebase-config.js  ← Firebase app init (your config is here)
├── auth.js             ← GitHub / Google / Microsoft sign-in + presence
├── chat.js             ← Firestore channels + RTDB messages + presence listener
├── upload.js           ← Firebase Storage file uploads
└── app.js              ← UI controller (ties everything together)
```

---

## Firebase Console Setup (Required)

### 1. Authentication — enable all three providers

Go to **Firebase Console → Authentication → Sign-in method** and enable:

| Provider   | Notes |
|------------|-------|
| GitHub     | Create OAuth App at github.com/settings/developer_settings → OAuth Apps. Callback URL: `https://chatly-859d4.firebaseapp.com/__/auth/handler` |
| Google     | Just toggle on, no extra config needed |
| Microsoft  | Register app at portal.azure.com → App registrations. Redirect URI: `https://chatly-859d4.firebaseapp.com/__/auth/handler` |

### 2. Realtime Database

Go to **Firebase Console → Build → Realtime Database → Create database** (choose your region, start in test mode).

The URL in `firebase-config.js` is pre-set to:
```
https://chatly-859d4-default-rtdb.firebaseio.com
```

Add these **Rules** (Realtime Database → Rules tab):
```json
{
  "rules": {
    "messages": {
      "$channelId": {
        ".read":  "auth != null",
        ".write": "auth != null"
      }
    },
    "presence": {
      ".read":  "auth != null",
      "$uid": {
        ".write": "auth != null && auth.uid === $uid"
      }
    }
  }
}
```

### 3. Firestore

Go to **Firebase Console → Build → Firestore Database → Create database** (start in test mode).

Add these **Rules**:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /servers/{serverId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
      match /channels/{channelId} {
        allow read:   if request.auth != null;
        allow write:  if request.auth != null;
      }
    }
  }
}
```

### 4. Storage

Go to **Firebase Console → Build → Storage → Get started**.

Add these **Rules**:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /uploads/{channelId}/{userId}/{fileName} {
      allow read:  if request.auth != null;
      allow write: if request.auth != null
                   && request.resource.size < 25 * 1024 * 1024;
    }
  }
}
```

---

## Running Locally

> ⚠️ Must be served over HTTP (not `file://`) for ES modules and Firebase Auth to work.

**Option A — Python (no install needed):**
```bash
cd chatly
python3 -m http.server 3000
# open http://localhost:3000
```

**Option B — Node.js:**
```bash
npx serve chatly
```

**Option C — VS Code:**
Install the **Live Server** extension → right-click `index.html` → Open with Live Server.

---

## Features

| Feature | Implementation |
|---------|----------------|
| Real-time messages | Firebase Realtime Database |
| Channels & servers | Firestore (persists across sessions) |
| File/image uploads  | Firebase Storage (drag-drop + paste supported) |
| GitHub login        | Firebase Auth + GithubAuthProvider |
| Google login        | Firebase Auth + GoogleAuthProvider |
| Microsoft login     | Firebase Auth + OAuthProvider("microsoft.com") |
| Online presence     | RTDB + onDisconnect cleanup |
| Markdown-lite       | **bold**, *italic*, `code` |

---

## Deploying to Firebase Hosting (optional)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # set public dir to "chatly", SPA: no
firebase deploy
```

Your app will be live at `https://chatly-859d4.web.app`.
