<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Chatly</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%234f8ef7'/><text y='22' x='7' font-size='18'>💬</text></svg>" />
  <link rel="stylesheet" href="style.css" />
</head>
<body>

<!-- ══════════════════════════ LOGIN ══════════════════════════ -->
<div id="login-screen">
  <div class="login-bg"></div>
  <div class="login-card">

    <div class="login-brand">
      <div class="login-logo">💬</div>
      <div class="login-wordmark">Chatly</div>
    </div>

    <p class="login-tagline">Real-time chat for your team.<br/>Sign in to get started.</p>

    <div class="login-providers">
      <!-- GitHub -->
      <button class="login-btn btn-github" onclick="app.signInWithGitHub()">
        <svg viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
        Continue with GitHub
      </button>

      <!-- Google -->
      <button class="login-btn btn-google" onclick="app.signInWithGoogle()">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      <!-- Microsoft -->
      <button class="login-btn btn-microsoft" onclick="app.signInWithMicrosoft()">
        <svg viewBox="0 0 23 23" width="18" height="18">
          <path fill="#f25022" d="M1 1h10v10H1z"/>
          <path fill="#00a4ef" d="M12 1h10v10H12z"/>
          <path fill="#7fba00" d="M1 12h10v10H1z"/>
          <path fill="#ffb900" d="M12 12h10v10H12z"/>
        </svg>
        Continue with Microsoft
      </button>
    </div>

    <div class="login-divider">or</div>

    <p class="login-footer">
      By signing in you agree to our Terms of Service.<br/>
      Messages stored via Firebase · Auth via OAuth
    </p>
  </div>
</div>

<!-- ══════════════════════════ APP ══════════════════════════ -->
<div id="app">

  <!-- Server Rail -->
  <div id="server-rail">
    <!-- Home icon always present -->
    <div class="server-icon active" data-sid="home" title="Home" onclick="app.selectServer('home')">💬</div>
    <div class="server-divider"></div>
    <!-- Dynamic server icons injected here -->
    <div id="server-rail-icons"></div>
  </div>

  <!-- Channel Sidebar -->
  <div id="channel-sidebar">
    <div class="sidebar-header">
      <span id="server-name">Chatly</span>
      <span class="chevron">▾</span>
    </div>

    <div id="channel-list">
      <!-- Populated by app.js -->
    </div>

    <!-- User Panel -->
    <div class="user-panel">
      <div class="uav" id="current-user-avatar">
        <span class="status-dot"></span>
      </div>
      <div class="uinfo">
        <div class="uname" id="current-user-name">—</div>
        <div class="ustatus">Online</div>
      </div>
      <button class="panel-btn" title="Sign Out" onclick="app.signOut()">
        <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      </button>
    </div>
  </div>

  <!-- Main Chat -->
  <div id="main">

    <!-- Header -->
    <div id="chat-header">
      <div class="header-channel">
        <span class="header-hash">#</span>
        <span id="channel-title">general</span>
      </div>
      <div id="channel-topic">Welcome to Chatly!</div>
      <div class="header-actions">
        <button class="hdr-btn" title="Members" onclick="app.toggleMembers()">
          <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
        </button>
        <button class="hdr-btn" title="Search" onclick="app.showToast('Search coming soon 🚧')">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </button>
        <button class="hdr-btn" title="Inbox" onclick="app.showToast('Notifications coming soon 🚧')">
          <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
        </button>
      </div>
    </div>

    <!-- Messages -->
    <div id="messages-area">
      <!-- Populated by app.js -->
    </div>

    <!-- Typing -->
    <div id="typing-indicator"></div>

    <!-- File preview strip -->
    <div id="file-preview-bar" class="hidden"></div>

    <!-- Upload progress -->
    <div id="upload-progress" class="hidden"></div>

    <!-- Input -->
    <div id="message-input-area" style="position:relative">
      <div id="emoji-picker"></div>
      <div class="input-wrapper">
        <button class="inp-action" title="Attach File" onclick="app.openFilePicker()">
          <svg viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
        </button>
        <textarea
          id="message-input"
          rows="1"
          placeholder="Message #general"
        ></textarea>
        <button class="inp-action" title="Emoji" data-emoji-toggle onclick="app.toggleEmojiPicker()">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
        </button>
        <button id="send-btn" title="Send Message" onclick="app.sendMessage()">
          <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>

  </div><!-- /#main -->

  <!-- Member Sidebar -->
  <div id="member-sidebar">
    <div class="members-section-label">Online — <span id="online-count">0</span></div>
    <div id="online-members"></div>
    <div class="members-section-label" style="margin-top:10px">Offline</div>
    <div id="offline-members"></div>
  </div>

</div><!-- /#app -->

<div id="toast"></div>

<!-- Load app as ES module -->
<script type="module" src="app.js"></script>
</body>
</html>
