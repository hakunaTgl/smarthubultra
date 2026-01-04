# Smart Hub Ultra - Copilot Instructions

## Project Overview

Smart Hub Ultra is a Progressive Web App (PWA) for creating, managing, and testing AI bots. The application combines an approachable UI with offline support, real-time collaboration, and advanced features like Behavioral DNA mapping, AR/voice interaction modes, and a digital-twin platform vision.

**Technology Stack:**
- Frontend: Vanilla JavaScript (ES Modules), HTML, CSS
- Backend: Firebase (Realtime Database, Authentication, Functions, Analytics)
- Build Tool: Vite
- PWA: Service Worker with offline support

**Repository Structure:**
- `index.html`, `dashboard.html`, `bots.html`, `boss.html` - Main HTML pages
- `js/` - Application modules (auth, bots, dashboard, collaboration, etc.)
- `functions/` - Firebase Cloud Functions for backend logic
- `css/` - Stylesheets (glassmorphic UI theme)
- `scripts/` - Utility scripts (audit, simulation)
- `manifest.json`, `sw.js` - PWA configuration
- `cli.js` - Command-line interface for bot management

## Development Environment Setup

### Prerequisites
- Node.js LTS (v16 or higher)
- npm (comes with Node.js)
- A modern web browser (Chrome recommended for PWA testing)

### Installation
```bash
npm install
```

### Firebase Functions Setup
```bash
cd functions
npm install
cd ..
```

## Development Workflow

### Running the Development Server
```bash
npm run dev
# or
npm start
```

This starts Vite dev server at `http://localhost:5173` with hot module reloading.

### Building for Production
```bash
npm run build
```

Outputs production-ready files to the `dist/` directory.

### Preview Production Build
```bash
npm run preview
```

Serves the production build locally on port 5000.

### Code Quality Commands
```bash
npm run lint      # Run ESLint (non-fatal, continues on warnings)
npm run format    # Format code with Prettier
npm run clean     # Remove build artifacts (dist, .cache)
```

### CLI Tool
```bash
npm run cli init-bot <botName>       # Create a new bot blueprint
npm run cli run-task <scriptPath>    # Execute a Node.js script
```

### Audit and Analysis
```bash
node scripts/audit.js           # Generate audit report
node scripts/simulateSessions.js 1000 50  # Simulate sessions (1000 sessions, concurrency 50)
```

## Code Style and Conventions

### JavaScript Standards
- **ES Modules:** Use `import/export` syntax for all modules
- **Modern JavaScript:** Target ES2021+ features
- **File Organization:** Keep modules focused and single-purpose
- **Naming Conventions:**
  - Files: camelCase (e.g., `behavioralDNA.js`, `firebaseConfig.js`)
  - Functions: camelCase (e.g., `generateInstanceCode()`, `showToast()`)
  - Classes: PascalCase if used
  - Constants: UPPER_SNAKE_CASE (e.g., `FUNCTIONS_REGION`)

### Code Formatting
- **Prettier Configuration:**
  - Print width: 100 characters
  - Tab width: 2 spaces
  - Single quotes: true
  - Trailing commas: ES5 style
  - Run `npm run format` before committing

### ESLint Rules
- Environment: Browser, ES2021, Node
- Extends: `eslint:recommended`
- Unused variables: Warn (arguments starting with `_` are ignored)
- Console statements: Allowed (off)
- Global variables: `firebase`, `QRCode`, `gapi`, `chrome`, `browser`

### Module Structure
Follow the existing pattern in `js/` modules:
```javascript
// Import dependencies
import { database, auth } from './firebaseConfig.js';
import { showToast } from './utils.js';

// Export functions
export function myFunction() {
  // Implementation
}

// Initialize module if needed
export function initModule() {
  // Setup code
}
```

### Firebase Integration
- Use modular Firebase SDK (v9+) from `js/firebaseConfig.js`
- Import only needed Firebase functions to reduce bundle size
- Use the compatibility shim (`js/firebase-compat.js`) for legacy code migration
- Access Firebase services via exports:
  ```javascript
  import { database, dbRef, auth, functions, httpsCallable } from './firebaseConfig.js';
  ```

## Testing Guidelines

### Manual Testing
- Use `test.html` for component testing
- Test PWA features in Chrome DevTools (Application tab)
- Verify offline functionality using Service Worker
- Test on actual Android devices when possible

### Firebase Functions Testing
- Use Firebase emulators for local testing:
  ```bash
  firebase emulators:start --only functions
  ```
- Functions automatically connect to emulator on localhost

### Test Scenarios to Verify
1. Authentication flows (sign up, sign in, password recovery)
2. Bot creation and management
3. Real-time collaboration features
4. Offline functionality and data sync
5. PWA installation and updates
6. Firebase Functions calls

## Dependencies Management

### Adding Dependencies
1. Check if the dependency is truly needed (prefer vanilla JS when possible)
2. Add to `package.json` with specific version constraints
3. Run `npm install` to update `package-lock.json`
4. Document usage in code comments if not obvious

### Firebase Functions Dependencies
- Managed separately in `functions/package.json`
- Keep aligned with Firebase Functions runtime requirements

### Core Dependencies
- `firebase` - Backend services integration
- `commander` - CLI tool support
- `vite` - Build tool and dev server
- `eslint`, `prettier` - Code quality tools
- `rimraf` - Cross-platform clean utility

## Security and Best Practices

### API Keys and Secrets
- **Never commit secrets** to the repository
- Firebase config in `js/firebaseConfig.js` is public (client-side keys) - this is normal and secure
- Sensitive operations use Firebase Functions with proper auth checks
- Firebase Functions runtime secrets managed via `firebase functions:config:set`

### Authentication
- Always verify user authentication state before sensitive operations
- Use Firebase Auth for all authentication flows
- Implement proper error handling for auth failures
- Follow Firebase Security Rules for database access

### Content Security
- Validate user inputs in bot creation and collaboration features
- Sanitize user-generated content before display
- Be mindful of content generation safety in AI bot features
- Use Firebase Security Rules to enforce data access control

### PWA Security
- Service Worker only caches approved resources
- Validate all network requests
- Keep dependencies updated for security patches

## Firebase Functions Configuration

Functions are located in the `functions/` directory and handle:
- Transactional invites and email notifications
- Admin claims and permissions
- Scheduled cleanup tasks (guest accounts, expired sessions)

### Required Configuration
```bash
firebase functions:config:set \
  admin.manual_secret="YOUR_SECRET" \
  sendgrid.api_key="YOUR_KEY" \
  sendgrid.from="no-reply@yourdomain.com" \
  app.signin_url="https://yourapp.web.app" \
  cleanup.guest_ttl_ms="172800000" \
  cleanup.session_ttl_ms="172800000" \
  cleanup.project_ttl_ms="604800000"
```

### Deployment
```bash
firebase deploy --only functions
```

## Common Tasks and Patterns

### Creating a New Feature Module
1. Create file in `js/` directory (e.g., `js/myFeature.js`)
2. Follow ES module export pattern
3. Import in relevant HTML pages or other modules
4. Add initialization in `main.js` if needed
5. Update relevant HTML pages with UI elements
6. Test in development mode
7. Run lint and format before committing

### Adding a New Bot Template
1. Create JSON file in `bots/` directory
2. Follow structure in `bots/exampleBot.json`
3. Include behavioral DNA attributes
4. Test with bot creation flow
5. Document in README if noteworthy

### Modifying UI Components
1. Update HTML structure in relevant page
2. Update CSS in `css/style.css` (follow glassmorphic theme)
3. Add JavaScript interactions in appropriate module
4. Test responsive behavior on mobile
5. Verify PWA functionality is maintained
6. Take screenshots of significant UI changes

### Working with Real-time Collaboration
- Code in `js/collab.js` and `js/rooms.js`
- Uses Firebase Realtime Database for live updates
- Handle connection state changes gracefully
- Implement proper cleanup on disconnect

## CI/CD Pipeline

The repository uses GitHub Actions for continuous integration:
- **Workflow:** `.github/workflows/ci.yml`
- **Triggers:** Push to `main`, pull requests to `main`
- **Steps:**
  1. Install Node.js dependencies
  2. Run audit script (continue on error)
  3. Upload audit report as artifact
  4. Run linter
  5. Build production bundle
  6. Upload build artifacts

### Before Merging PRs
- Ensure CI passes all checks
- Review audit report for any new issues
- Verify build succeeds
- Lint and format code locally first

## Documentation

### When to Update README
- Major feature additions
- Changes to setup/installation process
- New dependencies or system requirements
- Updated Firebase configuration steps
- Significant architecture changes

### Code Comments
- Explain "why" rather than "what"
- Document complex algorithms or non-obvious behavior
- Add JSDoc comments for public API functions
- Keep comments up-to-date with code changes

### Plugin System
- Plugins live in `plugins/` directory
- Each plugin has its own README
- Example: `plugins/analytics/` with dashboard stub

## Project Vision and Future Direction

Smart Hub Ultra is evolving toward a digital-twin platform:
- Users spawn agents reflecting their preferences and data
- Enhanced Vibe Quiz with validated psychometric mapping
- Hybrid Memory Core: in-memory, IndexedDB, vector embeddings, graph DB
- Pluggable-brain API for multiple AI models (OpenAI, Llama, Claude)
- Rich plugin marketplace and dashboard system

When contributing, consider this vision and design features with extensibility in mind.

## Getting Help

- Review `README.md` for comprehensive project overview
- Check `SYSTEM_FIXES.md` for known issues and solutions
- Inspect example code in `js/` modules
- Test features locally with `npm run dev`
- Use `test.html` for component testing
- Review Firebase documentation for backend integration

## Contributing Guidelines

1. **Fork and Branch:** Create feature branches from `main`
2. **Code Quality:** Run `npm run lint` and `npm run format`
3. **Testing:** Test changes locally, verify PWA functionality
4. **Documentation:** Update README for significant changes
5. **Pull Requests:**
   - Provide clear description of changes
   - Include screenshots/GIFs for UI changes
   - Ensure CI passes
   - Reference related issues

## License

MIT License - See `LICENSE` file for details.
