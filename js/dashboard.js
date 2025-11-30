<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Smart Hub Ultra - Dashboard</title>
  <link rel="stylesheet" href="/css/style.css">
  <link rel="manifest" href="/manifest.json">
  <script type="module">
    import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
    import { getAnalytics } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics.js';
    import { getAuth } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
    import { getDatabase } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';
    const firebaseConfig = {
      apiKey: "AIzaSyAPPllpKiFOcjqxnuk2tRvithFYKSzkQAc",
      authDomain: "smarthubultra.firebaseapp.com",
      databaseURL: "https://smarthubultra-default-rtdb.firebaseio.com",
      projectId: "smarthubultra",
      storageBucket: "smarthubultra.appspot.com",
      messagingSenderId: "12039705608",
      appId: "1:12039705608:web:f1a4383b245275eaa26dbd",
      measurementId: "G-V24P3DHL9M"
    };
    const app = initializeApp(firebaseConfig);
    getAnalytics(app);
  </script>
</head>
<body>
  <div id="dashboard-page" class="page">
    <div class="page-content glassmorphic">
      <h2>Dashboard</h2>
      <p id="welcome-message"></p>
      <div id="weather"></div>
      <div id="ai-insights"></div>
      <div id="daily-challenges"></div>
      <div class="dashboard-nav">
        <a href="/bots" class="nav-link">Bots</a>
        <a href="/inspiration" class="nav-link">Inspiration</a>
        <a href="/workshop" class="nav-link">Workshop</a>
        <a href="/editor" class="nav-link">Editor</a>
        <a href="/playground" class="nav-link">Playground</a>
        <a href="/creators" class="nav-link">Creators</a>
        <a href="/collab" class="nav-link">Collab</a>
        <a href="/voice" class="nav-link">Voice</a>
        <a href="/analytics" class="nav-link">Analytics</a>
        <a href="/account" class="nav-link">Account</a>
        <a href="/manual" class="nav-link">Manual</a>
        <a href="/boss" class="nav-link">Boss View</a>
        <a href="/ar" class="nav-link">AR Mode</a>
        <button id="predictive-btn">Predictive Tasks</button>
      </div>
      <div id="notification-list"></div>
      <span id="notification-count" class="hidden"></span>
      <button id="notification-icon">Notifications</button>
    </div>
  </div>
  <script src="/js/main.js" type="module"></script>
  <script src="/js/dashboard.js" type="module"></script>
  <script src="/js/notifications.js" type="module"></script>
</body>
</html>
