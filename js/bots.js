<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Smart Hub Ultra - Bots</title>
  <link rel="stylesheet" href="/css/style.css">
  <link rel="manifest" href="/manifest.json">
  <script type="module">
    import { app, analytics } from './firebaseConfig.js';
    void app;
    void analytics;
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
