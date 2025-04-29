<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Smart Hub Ultra - Bots</title>
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
      storageBucket: "smarthubultra.firebasestorage.app",
      messagingSenderId: "12039705608",
      appId: "1:12039705608:web:f1a4383b245275eaa26dbd",
      measurementId: "G-V24P3DHL9M"
    };
    const app = initializeApp(firebaseConfig);
    getAnalytics(app);
  </script>
</head>
<body>
  <div id="bots-page" class="page">
    <div class="page-content glassmorphic">
      <h2>Bots</h2>
      <input id="bot-name" placeholder="Bot Name">
      <input id="bot-purpose" placeholder="Bot Purpose">
      <select id="bot-template"></select>
      <button id="create-bot">Create Bot</button>
      <input type="file" id="upload-blueprint" accept=".json">
      <div id="bot-list"></div>
      <div id="featured-bots"></div>
      <div id="marketplace"></div>
      <a href="/dashboard" class="nav-link">Back to Dashboard</a>
    </div>
  </div>
  <script src="/js/main.js" type="module"></script>
  <script src="/js/bots.js" type="module"></script>
</body>
</html>
