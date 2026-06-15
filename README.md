# Smart Hub Ultra

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Firebase](https://img.shields.io/badge/Firebase-Backend-FFCA28?logo=firebase)](https://firebase.google.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-5A0FC8)](#)
[![Branches: 41](https://img.shields.io/badge/Branches-41-blue)](#)
[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://hakunatgl.github.io/smarthubultra/)

> Smart Hub Ultra is a Progressive Web App (PWA) platform for creating, managing, and testing AI bots. Combines an approachable UI with advanced features: Behavioral DNA mapping, real-time collaboration, AR/voice interaction, and offline support.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Firebase Setup](#firebase-setup)
- [PWA Features](#pwa-features)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### AI Bot Management
- **Bot Creation**: Build bots via templates or write custom code from scratch
- **Behavioral DNA Mapping**: Oversight system for detecting rogue or unexpected bot behavior
- **Bot Marketplace**: Browse, share, and deploy community bots
- **Simulation Harness**: Test bots in sandboxed environments before deployment

### User Experience
- **"Nebula" Theme**: Glassmorphic UI with deep space aesthetics
- **Adaptive Dashboards**: Mobile-optimized with pill-based navigation
- **Holographic Guide**: Interactive onboarding and help system
- **AR Control Mode**: Augmented reality interface for advanced interactions
- **Voice Commands**: Integrated voice control for hands-free operation

### Collaboration
- **Real-Time Rooms**: Multi-user project development rooms
- **Live Chat**: Built-in messaging for team communication
- **Code Diffing**: Visual comparison of bot code changes
- **Vibe Quiz**: Psychometric data mapping for team alignment

### Developer Tools
- **CLI Entry**: `cli.js` for scripting, automation, and task execution
- **Audit CLI**: Code audit and compliance tooling
- **Code-first Access**: Generate project code instantly, no account friction
- **Plugin System**: Extensible architecture via `plugins/` directory

---

## Architecture

Smart Hub Ultra uses a **client-side first** architecture with Firebase for backend services:

```
smarthubultra/
  index.html              <-- Main application entry point
  js/
    auth.js               <-- Firebase authentication
    bots.js               <-- Bot management & marketplace
    dashboard.js          <-- AI insights & widgets
    firebaseConfig.js     <-- Centralized Firebase config
    vibeQuiz.js           <-- Psychometric data capture
  css/                    <-- Themes, responsive styles
  bots/                   <-- Bot blueprints & data
  plugins/analytics/      <-- Analytics plugin scaffold
  functions/              <-- Firebase Cloud Functions
  manifest.json           <-- PWA manifest
  sw.js                   <-- Service worker (offline support)
  cli.js                  <-- Command-line automation
```

---

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase project (free tier works)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/hakunaTgl/smarthubultra.git
cd smarthubultra

# 2. Install dependencies
npm install

# 3. Configure Firebase
cp .env.example .env.local
# Edit .env.local with your Firebase config values

# 4. Run locally
npx serve .
# OR with Parcel
npm run dev
```

### Firebase Setup

1. Create a project at [firebase.google.com](https://firebase.google.com)
2. Enable Authentication (Email/Password + Google)
3. Enable Firestore Database
4. Copy config values to `.env.local`
5. Deploy functions: `firebase deploy --only functions`

---

## Project Structure

```
smarthubultra/
|-- index.html              # Main entry point
|-- cli.js                  # CLI automation tool
|-- manifest.json           # PWA manifest
|-- sw.js                   # Service worker
|-- .env.example            # Environment template
|-- js/
|   |-- auth.js             # User authentication
|   |-- bots.js             # Bot management & templates
|   |-- dashboard.js        # Widgets & AI insights
|   |-- firebaseConfig.js   # Firebase initialization
|   `-- vibeQuiz.js         # Psychometric quiz
|-- css/                    # Stylesheets (Nebula theme)
|-- bots/                   # Bot blueprints (JSON)
|-- plugins/
|   `-- analytics/          # Analytics plugin
|-- functions/              # Firebase Cloud Functions
|-- scripts/                # Build & automation scripts
`-- public/                 # Static assets
```

---

## PWA Features

Smart Hub Ultra is fully PWA-compliant:

- **Offline Support**: Service worker caches core assets for offline access
- **Install Prompt**: "Add to Home Screen" on Android and desktop
- **Background Sync**: Queues actions when offline, syncs when reconnected
- **Push Notifications**: Bot alerts and collaboration updates
- **Responsive Design**: Optimized for mobile, tablet, and desktop

---

## Contributing

Contributions are welcome! Smart Hub Ultra has 41 active branches.

1. Fork the repository
2. Check open issues for tasks: `git checkout -b fix/issue-name`
3. Follow the ESLint config (`.eslintrc.json`) for code style
4. Run `npm run lint` before committing
5. Submit a Pull Request with a clear description

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

---

## Roadmap

- [x] PWA setup (manifest + service worker)
- [x] Firebase authentication & Firestore
- [x] Bot creation & marketplace
- [x] Behavioral DNA mapping
- [x] Real-time collaboration rooms
- [x] AR control mode
- [x] CLI automation tool
- [ ] MIDI/audio bot interactions
- [ ] Native mobile app (Capacitor)
- [ ] Bot version control & rollback
- [ ] Enterprise multi-tenant support

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<p align="center">Built with passion by <a href="https://github.com/hakunaTgl">hakunaTgl (Tylor Fenwick)</a> - <a href="https://hakunatgl.github.io">Portfolio</a></p>
