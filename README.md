# Smart Hub Ultra

Smart Hub Ultra is a Progressive Web App (PWA) for creating, managing, and testing AI bots. It combines an approachable UI, offline support, and advanced features like Behavioral DNA mapping, real-time collaboration, and AR/voice interaction modes.

This repository contains a mostly client-side app (HTML + JS) that uses Firebase for backend services. The project already includes pages, a service worker, and numerous feature modules under `js/`.

## Quick highlights
- PWA-ready: `manifest.json` + `sw.js` included
- Modular JS in `js/` (auth, bots, dashboard, collab, etc.)
- CLI entry `cli.js` for simple scripts and automation
- Code-first access: start instantly with a generated project code, resume later without email friction
- Immersive UI shell: refreshed nebula theming, adaptive dashboards, and pill-based navigation for a premium experience

## Quick start (developer)
1. Install Node.js (LTS) and npm.
2. Install dependencies:

```bash
npm install
```

3. Run dev server (Parcel):

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

5. Preview the built site:

```bash
npm run preview
```

6. Useful commands

```bash
npm run lint    # run ESLint (non-fatal)
npm run format  # run Prettier to format files
npm run clean   # remove build artifacts
```

## Cloud Functions (Admin + Maintenance)
Transactional invites, secure admin claims, and scheduled cleanup now live in Firebase Functions.

1. **Install backend dependencies**

  ```bash
  cd functions
  npm install
  cd ..
  ```

2. **Configure runtime secrets** (adjust values for your project):

  ```bash
  firebase functions:config:set \
    admin.manual_secret="SMARTHUB-EXEC-2025" \
    sendgrid.api_key="SG.your-key" \
    sendgrid.from="no-reply@smarthubultra.dev" \
    app.signin_url="https://smarthubultra.web.app" \
     cleanup.guest_ttl_ms="172800000" \
     cleanup.session_ttl_ms="172800000" \
     cleanup.project_ttl_ms="604800000"
  ```

  - `admin.manual_secret` must match the override code admins type client-side.
  - Omit the SendGrid keys to rely on manual invite links only.
  - `app.signin_url` is the base page appended to all generated magic links.
  - Cleanup TTLs (ms) control how long guest accounts, project codes, and sessions persist.

3. **Deploy or run locally**

  ```bash
  firebase deploy --only functions
  # or
  firebase emulators:start --only functions
  ```

4. **Optional client override** — set a custom Functions base URL (non-default regions, staging environments, etc.).

  ```html
  <script>window.SMART_HUB_FUNCTIONS_URL = 'https://us-central1-your-project.cloudfunctions.net';</script>
  ```

  When left unset, the app defaults to `https://us-central1-${projectId}.cloudfunctions.net`.

## Example: create or inspect the demo bot
An example bot template is included at `bots/exampleBot.json`. Use it as a starting point for bot creation or tests.

## Project structure (selected)
- `index.html` – main entry page
- `js/` – app modules (auth.js, main.js, bots.js, etc.)
- `bots/` – bot data/blueprints (added example)
- `cli.js` – CLI helper
- `manifest.json`, `sw.js` – PWA support

## Development notes and next improvements
- Convert modules in `js/` to ES module imports and a single `src/` entry to enable modern bundlers (optional).
- Add unit tests for core modules (bots, behavioralDNA) and a CI workflow (already added).
- Add integration tests or Playwright for end-to-end flows (signup, bot creation).

## New features added in this iteration
- Firebase compatibility shim (`js/firebase-compat.js`) to provide legacy `window.firebase` behavior while migrating to the modular SDK.
- Central modular Firebase config: `js/firebaseConfig.js`.
- Vibe Quiz: a simple psychometric-like quiz at the top of the auth page (module: `js/vibeQuiz.js`) that writes into `behavioral_dna/`.
- Plugin scaffold: `plugins/analytics/` (dashboard stub + README).
- UX polish: dark mode toggle and basic voice command toggle (emits `voice-command` events).
- Audit tooling: `scripts/audit.js` produces `audit-report.md` and CI uploads it automatically.
- Simulation harness: `scripts/simulateSessions.js` — run locally to simulate session timings.

## How to try the new pieces locally
- Run the dev server and open the app. Complete the Vibe Quiz on the landing/auth page.

```bash
npm install
npm run dev
```

- Run audit locally:

```bash
node scripts/audit.js
# opens/writes audit-report.md
```

- Run the local simulation (quick):

```bash
node scripts/simulateSessions.js 1000 50
# simulate 1000 sessions with concurrency 50
```

## Vision: digital twins and next steps
This branch of changes is the first step toward pivoting Smart Hub Ultra into a digital-twin platform: users spawn agents that reflect their vibe, preferences, and data. Next steps:
- Build a more thorough Vibe Quiz with validated psychometric items and map scores to richer Behavioral DNA.
- Design the Hybrid Memory Core: short-term in-memory cache, mid-term local IndexedDB, long-term vector embeddings (e.g., Pinecone/FAISS) and a graph DB for context graphs.
- Add a pluggable-brain API so users can choose OpenAI, Llama, Claude, or on-prem models by plugin.
- Add a richer plugin marketplace and dashboard system.


## Contributing
1. Fork the repo.
2. Create a feature branch.
3. Run `npm install`, implement changes, run `npm run lint` and `npm run format`.
4. Open a PR with a clear description and a screenshot/gif if UI changed.

## License
MIT — see the `LICENSE` file.

----
Small additions in this commit: basic lint/format scripts, CI workflow, an example bot template, and editor configs to make the project easier to work with and more attractive to contributors.
Smart Hub Ultra

Smart Hub Ultra is a Progressive Web App (PWA) for creating, managing, and testing AI bots. It features a responsive interface optimized for Android devices, real-time collaboration, bot templates, and advanced oversight with Behavioral DNA Mapping to ensure bots stay on track. This project uses Firebase for backend services and IndexedDB for local storage, making it accessible online and offline.

Features





Bot Creation & Management: Build bots visually or via code with templates and a marketplace.



Authentication: Secure sign-up, sign-in, and password recovery with clear error messages (e.g., "Invalid Password").



Dashboard: Displays weather, AI insights, and daily challenges, optimized for mobile.



Real-Time Collaboration: Live chat and code diffing for team projects.



Bot Oversight: Behavioral DNA Mapping and predictive tasks to detect rogue behavior.



Mobile Accessibility: Runs as a PWA on Android with swipe gestures and offline support.



Innovative Tools: Holographic guide, AR control mode, voice commands, and meme-driven inspiration.
Multi-User Rooms: Create or join project rooms for collaborative development.
O7 Integration: Optional module to connect with the O7 service.

Prerequisites





A modern web browser (Chrome recommended for PWA support).



Node.js and npm (for local testing).



A Firebase project for backend services.



An Android device for mobile use (optional but recommended).

Setup Instructions





Clone the Repository:

git clone https://github.com/your-username/smart-hub-ultra.git
cd smart-hub-ultra



Install Dependencies:

npm install



Set Up Firebase:





Create a Firebase project at console.firebase.google.com.



Enable Realtime Database and Authentication (Email/Password).



Copy your Firebase config object and replace the placeholders in js/main.js:

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};



Run Locally:

npx http-server

Open http://localhost:8080 in your browser.



Install as a PWA:





Open the app in Chrome on your Android device.



Tap the menu and select "Add to Home Screen" to install the PWA.



Access the app offline once the Service Worker is registered.



Test and Deploy:





Test features like bot creation, collaboration, and notifications.



Deploy to a hosting service like Firebase Hosting or Netlify:

firebase deploy

Command-Line Interface
----------------------
Use the CLI to create bot blueprints or run Node.js tasks.

```
npm run cli init-bot myBot
npm run cli run-task ./scripts/sampleTask.js
```

This will create `bots/myBot.json` with a basic structure or execute the specified script.

File Structure





index.html: Main HTML file with modal-based UI.



js/:





main.js: Initializes Firebase, Service Worker, and app navigation.
bots.html and dashboard.html provide pages for bot management and the dashboard.



auth.js: Manages user authentication and support tickets.



bots.js: Handles bot creation, templates, and marketplace.



dashboard.js: Loads dashboard widgets and insights.



(Other JS files for additional features like collaboration, AR mode, etc.)



css/style.css: Styles for glassmorphic UI and mobile responsiveness.



manifest.json: Configures PWA settings.



sw.js: Service Worker for offline support.

Usage





Sign Up/Sign In:





Use the Auth modal to create an account or sign in.



Look for clear error messages like "Invalid Password" if issues arise.



Create a Bot:





Navigate to the Bots modal.



Use a template or write custom code, then save with Behavioral DNA validation.



Test Bots:





Go to the Playground modal to test bots with live input or battle them.



Check for rogue behavior alerts from Predictive Tasks.



Collaborate:





Invite users in the Collab Hub for real-time coding and chat.



Explore Features:





Use the Holographic Guide for setup help.



Try AR Control Mode or Voice Commands for advanced interaction.

Troubleshooting





Service Worker Failure: Ensure sw.js is in the root directory and paths in main.js are correct.



Firebase Errors: Verify your Firebase config and enable Realtime Database rules.



Login Issues: Check for error messages like "Not Set Up Yet" and ensure email/password are correct.



Preview Error: Confirm all DOM elements exist in index.html and JS file paths start with /js/.

Contributing

Feel free to fork the repository, add features, and submit pull requests. Focus on mobile optimizations and bot oversight enhancements.

License

MIT License. See LICENSE for details.
