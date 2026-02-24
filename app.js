import { auth }                                    from "./firebase-config.js";
import { signInWithGitHub, signInWithGoogle,
         signInWithMicrosoft, signOut,
         setupPresence, onAuthChange }              from "./auth.js";
import { ensureDefaultServer, fetchServers,
         listenToChannels, createChannel,
         listenToMessages, detachMessageListener,
         sendMessage, listenToPresence }            from "./chat.js";
import { uploadFiles, isImage, fmtSize }           from "./upload.js";

// ─── State ──────────────────────────────────────────────────────────────────
let currentUser      = null;
let currentServerId  = null;
let currentChannelId = null;
let currentChannelName = "general";
let channels         = [];
let unsubChannels    = null;
let pendingFiles     = [];   // files queued before sending

const EMOJIS = [
  "😀","😂","😍","🤔","😎","🥳","😭","🤯","🙌","👍",
  "❤️","🔥","✨","🚀","💡","⚡","🎉","🛠️","🐛","🦄",
  "👀","💯","🎨","📦","🍕","☕","🌙","🌊","🌿","💎"
];

// ─── Selectors ───────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const loginScreen     = $("login-screen");
const appEl           = $("app");
const messagesArea    = $("messages-area");
const messageInput    = $("message-input");
const typingIndicator = $("typing-indicator");
const channelList     = $("channel-list");
const serverName      = $("server-name");
const channelTitle    = $("channel-title");
const channelTopic    = $("channel-topic");
const onlineMembersEl = $("online-members");
const offlineMembersEl= $("offline-members");
const onlineCount     = $("online-count");
const currentUserName = $("current-user-name");
const currentAvatar   = $("current-user-avatar");
const emojiPicker     = $("emoji-picker");
const filePreviewBar  = $("file-preview-bar");
const uploadProgress  = $("upload-progress");
const sendBtn         = $("send-btn");

// ─── Auth ────────────────────────────────────────────────────────────────────
onAuthChange(async user => {
  if (user) {
    currentUser = user;
    setupPresence(user);
    loginScreen.classList.add("hidden");
    appEl.classList.add("visible");
    setupUserPanel(user);
    await bootstrap();
  } else {
    currentUser = null;
    detachMessageListener();
    unsubChannels?.();
    loginScreen.classList.remove("hidden");
    appEl.classList.remove("visible");
  }
});

async function bootstrap() {
  try {
    const serverId = await ensureDefaultServer();
    const servers  = await fetchServers();
    currentServerId = serverId;
    renderServerRail(servers);
    loadServer(serverId, servers.find(s => s.id === serverId));
    listenToPresence(renderMembers);
  } catch (e) {
    showToast("⚠️ " + e.message, 5000);
  }
}

function setupUserPanel(user) {
  const name = user.displayName || user.email?.split("@")[0] || "User";
  currentUserName.textContent = name;
  currentAvatar.innerHTML = user.photoURL
    ? `<img src="${user.photoURL}" alt="You"><span class="status-dot"></span>`
    : `<span class="avatar-initials">${name.charAt(0).toUpperCase()}</span><span class="status-dot"></span>`;
}

// ─── Server Rail ─────────────────────────────────────────────────────────────
function renderServerRail(servers) {
  const rail = $("server-rail-icons");
  rail.innerHTML = servers.map((s, i) => `
    <div class="server-icon ${i === 0 ? "active" : ""}"
         data-sid="${s.id}"
         title="${escHtml(s.name)}"
         onclick="app.selectServer('${s.id}')">
      ${s.icon || s.name.charAt(0).toUpperCase()}
    </div>
  `).join("") + `
    <div class="server-divider"></div>
    <div class="server-add" title="Add Server" onclick="app.promptNewServer()">＋</div>
  `;
}

function loadServer(serverId, serverData) {
  currentServerId = serverId;
  serverName.textContent = serverData?.name || "Server";

  // Highlight rail icon
  document.querySelectorAll(".server-icon").forEach(el => {
    el.classList.toggle("active", el.dataset.sid === serverId);
  });

  // Subscribe to channels via Firestore
  unsubChannels?.();
  unsubChannels = listenToChannels(serverId, chs => {
    channels = chs;
    renderChannels(chs);
    if (!currentChannelId && chs.length > 0) {
      selectChannel(chs[0].id, chs[0].name, chs[0].topic || "");
    }
  });
}

// ─── Channels ────────────────────────────────────────────────────────────────
function renderChannels(chs) {
  channelList.innerHTML = `
    <div class="channel-group-header">
      <span class="group-label">Text Channels</span>
      <button class="group-action" title="New Channel" onclick="app.promptNewChannel()">＋</button>
    </div>
  ` + chs.map(ch => `
    <div class="channel-item ${ch.id === currentChannelId ? "active" : ""}"
         id="ch-${ch.id}"
         onclick="app.selectChannel('${ch.id}', '${escAttr(ch.name)}', '${escAttr(ch.topic || '')}')">
      <span class="ch-icon">#</span>
      <span class="ch-name">${escHtml(ch.name)}</span>
    </div>
  `).join("");
}

function selectChannel(id, name, topic) {
  currentChannelId   = id;
  currentChannelName = name;

  // Update header
  channelTitle.textContent = name;
  channelTopic.textContent = topic || "";
  messageInput.placeholder = `Message #${name}`;

  // Update sidebar highlight
  document.querySelectorAll(".channel-item").forEach(el => {
    el.classList.toggle("active", el.id === "ch-" + id);
  });

  // Listen to messages
  listenToMessages(id, renderMessages);
}

// ─── Messages ─────────────────────────────────────────────────────────────────
function renderMessages(msgs) {
  const area = messagesArea;
  const atBottom = area.scrollHeight - area.scrollTop - area.clientHeight < 100;

  if (msgs.length === 0) {
    area.innerHTML = welcomeBanner();
    return;
  }

  let html = welcomeBanner();
  let lastDate = "";
  let lastUid  = "";
  let lastTs   = 0;

  for (const msg of msgs) {
    const d       = new Date(msg.ts || Date.now());
    const dateStr = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    const timeStr = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    if (dateStr !== lastDate) {
      html += `<div class="date-divider"><span>${escHtml(dateStr)}</span></div>`;
      lastDate = dateStr;
      lastUid  = "";
    }

    const continued = msg.uid === lastUid && (msg.ts - lastTs) < 300_000;
    lastUid = msg.uid;
    lastTs  = msg.ts;

    const avatar = msg.photoURL
      ? `<img src="${escHtml(msg.photoURL)}" alt="">`
      : `<span class="avatar-initials sm">${(msg.displayName || "?").charAt(0).toUpperCase()}</span>`;

    const attachmentsHtml = (msg.attachments || []).map(a => renderAttachment(a)).join("");

    if (!continued) {
      html += `
        <div class="msg-group" data-mid="${msg.id}">
          <div class="msg-avatar">${avatar}</div>
          <div class="msg-body">
            <div class="msg-meta">
              <span class="msg-author">${escHtml(msg.displayName || "Unknown")}</span>
              <span class="msg-time">${escHtml(timeStr)}</span>
            </div>
            ${msg.text ? `<div class="msg-text">${formatText(msg.text)}</div>` : ""}
            ${attachmentsHtml}
          </div>
        </div>`;
    } else {
      html += `
        <div class="msg-group continued" data-mid="${msg.id}">
          <div class="msg-avatar ghost"><span class="msg-time-hover">${escHtml(timeStr)}</span></div>
          <div class="msg-body">
            ${msg.text ? `<div class="msg-text">${formatText(msg.text)}</div>` : ""}
            ${attachmentsHtml}
          </div>
        </div>`;
    }
  }

  area.innerHTML = html;
  if (atBottom) area.scrollTop = area.scrollHeight;
}

function renderAttachment({ url, name, type, size }) {
  if (isImage(type)) {
    return `<div class="attachment image">
      <img src="${escHtml(url)}" alt="${escHtml(name)}" onclick="window.open('${escHtml(url)}','_blank')" />
    </div>`;
  }
  return `<div class="attachment file">
    <div class="file-icon">📄</div>
    <div class="file-info">
      <a href="${escHtml(url)}" target="_blank" class="file-name">${escHtml(name)}</a>
      <span class="file-size">${fmtSize(size)}</span>
    </div>
    <a href="${escHtml(url)}" download="${escHtml(name)}" class="download-btn" title="Download">↓</a>
  </div>`;
}

function welcomeBanner() {
  return `<div class="welcome-banner">
    <div class="wb-icon">💬</div>
    <h2>Welcome to #${escHtml(currentChannelName)}!</h2>
    <p>This is the beginning of the <strong>#${escHtml(currentChannelName)}</strong> channel.</p>
  </div>`;
}

// ─── Send ─────────────────────────────────────────────────────────────────────
async function handleSend() {
  if (!currentUser || !currentChannelId) return;
  const text = messageInput.value.trim();
  if (!text && pendingFiles.length === 0) return;

  messageInput.value = "";
  autoResize();
  updateSendBtn();
  closeEmojiPicker();

  let attachments = [];

  if (pendingFiles.length > 0) {
    uploadProgress.classList.remove("hidden");
    try {
      attachments = await uploadFiles(
        pendingFiles, currentChannelId, currentUser.uid,
        (i, total, pct) => {
          uploadProgress.textContent = `Uploading ${i + 1}/${total} — ${pct}%`;
        }
      );
    } catch (e) {
      showToast("Upload failed: " + e.message, 4000);
    } finally {
      uploadProgress.classList.add("hidden");
      clearFilePreview();
    }
  }

  try {
    await sendMessage(currentChannelId, currentUser, text, attachments);
  } catch (e) {
    showToast("Failed to send: " + e.message, 4000);
  }
}

// ─── File Picker ──────────────────────────────────────────────────────────────
function openFilePicker() {
  const input = document.createElement("input");
  input.type     = "file";
  input.multiple = true;
  input.accept   = "image/*,application/pdf,text/*,application/zip,video/*,audio/*";
  input.onchange = e => addPendingFiles(Array.from(e.target.files));
  input.click();
}

function addPendingFiles(files) {
  pendingFiles = [...pendingFiles, ...files].slice(0, 10); // max 10 files
  renderFilePreview();
}

function renderFilePreview() {
  if (pendingFiles.length === 0) {
    filePreviewBar.classList.add("hidden");
    return;
  }
  filePreviewBar.classList.remove("hidden");
  filePreviewBar.innerHTML = pendingFiles.map((f, i) => {
    const thumb = f.type.startsWith("image/")
      ? `<img src="${URL.createObjectURL(f)}" class="preview-thumb" alt="">`
      : `<span class="preview-icon">📄</span>`;
    return `<div class="preview-item">
      ${thumb}
      <span class="preview-name">${escHtml(f.name)}</span>
      <button class="preview-remove" onclick="app.removePendingFile(${i})">×</button>
    </div>`;
  }).join("");
}

function clearFilePreview() {
  pendingFiles = [];
  renderFilePreview();
}

// Drag-and-drop onto chat area
messagesArea.addEventListener("dragover", e => { e.preventDefault(); messagesArea.classList.add("drop-active"); });
messagesArea.addEventListener("dragleave", () => messagesArea.classList.remove("drop-active"));
messagesArea.addEventListener("drop", e => {
  e.preventDefault();
  messagesArea.classList.remove("drop-active");
  addPendingFiles(Array.from(e.dataTransfer.files));
});

// ─── Input handling ───────────────────────────────────────────────────────────
let typingTimeout;

messageInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
});

messageInput.addEventListener("input", () => {
  autoResize();
  updateSendBtn();
  showTyping();
});

messageInput.addEventListener("paste", e => {
  const items = e.clipboardData?.items;
  if (!items) return;
  const imageFiles = [];
  for (const item of items) {
    if (item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file) imageFiles.push(file);
    }
  }
  if (imageFiles.length > 0) addPendingFiles(imageFiles);
});

function autoResize() {
  messageInput.style.height = "auto";
  messageInput.style.height = Math.min(messageInput.scrollHeight, 180) + "px";
}

function updateSendBtn() {
  const hasContent = messageInput.value.trim().length > 0 || pendingFiles.length > 0;
  sendBtn.classList.toggle("active", hasContent);
}

function showTyping() {
  clearTimeout(typingTimeout);
  typingIndicator.innerHTML = `
    <div class="typing-dots"><span></span><span></span><span></span></div>
    <span>${escHtml(currentUser?.displayName?.split(" ")[0] || "Someone")} is typing…</span>`;
  typingTimeout = setTimeout(() => { typingIndicator.innerHTML = ""; }, 2000);
}

// ─── Emoji Picker ─────────────────────────────────────────────────────────────
function toggleEmojiPicker() {
  if (!emojiPicker.innerHTML) {
    emojiPicker.innerHTML = EMOJIS.map(e =>
      `<button class="emoji-btn" onclick="app.insertEmoji('${e}')">${e}</button>`
    ).join("");
  }
  emojiPicker.classList.toggle("open");
}

function closeEmojiPicker() { emojiPicker.classList.remove("open"); }

document.addEventListener("click", e => {
  if (!emojiPicker.contains(e.target) && !e.target.closest("[data-emoji-toggle]")) {
    closeEmojiPicker();
  }
});

// ─── Members ─────────────────────────────────────────────────────────────────
function renderMembers(presence) {
  const online  = Object.values(presence).filter(u => u.online);
  const offline = Object.values(presence).filter(u => !u.online).slice(0, 12);
  onlineCount.textContent = online.length;

  const mkMember = u => {
    const status = u.online ? "online" : "offline";
    const av = u.photoURL
      ? `<img src="${escHtml(u.photoURL)}" alt="">`
      : `<span class="avatar-initials sm">${(u.displayName || "?").charAt(0).toUpperCase()}</span>`;
    return `<div class="member-item">
      <div class="member-avatar">${av}<div class="member-status ${status}"></div></div>
      <span class="member-name">${escHtml(u.displayName || "User")}</span>
    </div>`;
  };

  onlineMembersEl.innerHTML  = online.map(mkMember).join("");
  offlineMembersEl.innerHTML = offline.map(mkMember).join("");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatText(text) {
  return escHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g,     "<em>$1</em>")
    .replace(/`([^`]+)`/g,     "<code>$1</code>")
    .replace(/https?:\/\/\S+/g, url => `<a href="${url}" target="_blank" rel="noopener">${url}</a>`)
    .replace(/\n/g,             "<br>");
}

function escHtml(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function escAttr(s) {
  return String(s).replace(/'/g, "\\'").replace(/"/g, "&quot;");
}

let toastTimer;
function showToast(msg, duration = 3000) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), duration);
}

// ─── Global app API (for inline onclick attributes) ──────────────────────────
window.app = {
  signInWithGitHub:    async () => { try { await signInWithGitHub();    } catch(e) { showToast(e.message); } },
  signInWithGoogle:    async () => { try { await signInWithGoogle();    } catch(e) { showToast(e.message); } },
  signInWithMicrosoft: async () => { try { await signInWithMicrosoft(); } catch(e) { showToast(e.message); } },
  signOut:             () => signOut(),

  selectServer:  (id) => {
    const servers = [];  // already loaded, re-fetch on demand if needed
    loadServer(id, { name: "Server" });
  },
  selectChannel: (id, name, topic) => selectChannel(id, name, topic),

  promptNewChannel: async () => {
    const name = prompt("New channel name (lowercase, no spaces):");
    if (!name || !currentServerId) return;
    try { await createChannel(currentServerId, name); }
    catch(e) { showToast("Error: " + e.message); }
  },
  promptNewServer: () => showToast("Server creation coming soon! 🚧"),

  sendMessage:      handleSend,
  toggleEmojiPicker,
  insertEmoji:      (e) => { messageInput.value += e; messageInput.focus(); updateSendBtn(); closeEmojiPicker(); },
  openFilePicker,
  removePendingFile: (i) => { pendingFiles.splice(i, 1); renderFilePreview(); updateSendBtn(); },
  toggleMembers:    () => {
    const s = $("member-sidebar");
    s.style.display = s.style.display === "none" ? "" : "none";
  },
  showToast
};
