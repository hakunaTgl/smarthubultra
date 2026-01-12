# Deployment Guide

## Prerequisites

- Node.js 18+ and npm
- Firebase CLI: `npm install -g firebase-tools`
- Firebase project created at [console.firebase.google.com](https://console.firebase.google.com)
- Git installed

## Environment Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/hakunaTgl/smarthubultra.git
   cd smarthubultra
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

4. **Firebase configuration**
   - Create a Firebase project
   - Enable Authentication (Email/Password)
   - Enable Realtime Database or Firestore
   - Copy Firebase config to your environment

## Development

```bash
# Run development server
npm run dev

# Run linter
npm run lint

# Format code
npm run format

# Clean build artifacts
npm run clean
```

## Building for Production

```bash
# Create production build
npm run build

# Preview production build locally
npm run preview
```

## Deployment Options

### Option 1: Firebase Hosting (Recommended)

```bash
# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Deploy Functions (if applicable)
firebase deploy --only functions
```

### Option 2: Netlify

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard
5. Deploy automatically on push

### Option 3: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

## Environment Variables

Set these in your hosting platform:

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_DATABASE_URL`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`

## Post-Deployment Checklist

- [ ] Verify all features work correctly
- [ ] Test authentication flow
- [ ] Check bot creation and management
- [ ] Verify Firebase connections
- [ ] Test on mobile devices
- [ ] Check PWA installation

## Continuous Deployment

GitHub Actions automatically deploy to Firebase Hosting on push to main branch.

To enable:
1. Add `FIREBASE_SERVICE_ACCOUNT` to GitHub Secrets
2. Update `.github/workflows/ci.yml` with your project ID
3. Push to main branch

## Troubleshooting

### Build fails
- Clear node_modules: `rm -rf node_modules package-lock.json && npm install`
- Clear build cache: `npm run clean`

### Firebase deployment fails
- Check Firebase CLI version: `firebase --version`
- Re-login: `firebase logout && firebase login`
- Verify project: `firebase use`

### Environment variables not working
- Verify .env file exists and has correct values
- Restart development server
- Clear browser cache

## Rollback

```bash
# View deployment history
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL_ID TARGET_SITE_ID:live

# Or manually deploy previous version from git
git checkout <previous-commit-hash>
npm run build
firebase deploy
```

## Support

For deployment issues, create an issue at: https://github.com/hakunaTgl/smarthubultra/issues
