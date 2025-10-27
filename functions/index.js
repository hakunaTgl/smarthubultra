'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');

if (!admin.apps.length) {
  admin.initializeApp();
}

const runtimeConfig = functions.config();

const REGION = runtimeConfig.region?.primary || 'us-central1';
const MANUAL_SECRET = runtimeConfig.admin?.manual_secret || '';
const SENDGRID_API_KEY = runtimeConfig.sendgrid?.api_key || '';
const SENDGRID_FROM = runtimeConfig.sendgrid?.from || 'no-reply@smarthubultra.dev';
const MAGIC_LINK_EXPIRY_MS = Number(runtimeConfig.magiclinks?.ttl_ms) || (30 * 60 * 1000);
const GUEST_TTL_MS = Number(runtimeConfig.cleanup?.guest_ttl_ms) || (48 * 60 * 60 * 1000);
const SESSION_TTL_MS = Number(runtimeConfig.cleanup?.session_ttl_ms) || (48 * 60 * 60 * 1000);

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

const corsHandler = cors({ origin: true });

function sanitizeKey(email = '') {
  return email.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function buildMagicLinkUrl(token, baseUrl) {
  const url = new URL(baseUrl);
  url.searchParams.set('magicLink', token);
  return url.toString();
}

async function persistMagicLink(email, metadata = {}) {
  const token = `ml_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
  const createdAt = Date.now();
  const expiresAt = createdAt + MAGIC_LINK_EXPIRY_MS;
  const record = {
    email,
    createdAt,
    expiresAt,
    used: false,
    metadata: {
      ...metadata,
      method: metadata.method || 'magic-link'
    }
  };
  await admin.database().ref(`magicLinks/${token}`).set(record);
  const baseUrl = metadata.baseUrl || runtimeConfig.app?.signin_url || 'https://smarthubultra.web.app';
  return { token, expiresAt, url: buildMagicLinkUrl(token, baseUrl) };
}

async function updateUserRole(email, role = 'admin', accessTier = 'executive', badges = []) {
  const userKey = sanitizeKey(email);
  await admin.database().ref(`users/${userKey}`).update({
    role,
    accessTier,
    badges: Array.from(new Set(badges.concat(['admin']))),
    lastRoleUpdateAt: Date.now()
  });
}

exports.grantAdminRole = functions.region(REGION).https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in first.');
  }

  const callerClaims = context.auth.token || {};
  const overrideCode = (data?.overrideCode || '').trim();
  const allowOverride = MANUAL_SECRET && overrideCode && overrideCode === MANUAL_SECRET;

  if (!callerClaims.admin && !allowOverride) {
    throw new functions.https.HttpsError('permission-denied', 'Admin privileges required.');
  }

  const targetEmail = (data?.targetEmail || '').toLowerCase();
  if (!targetEmail) {
    throw new functions.https.HttpsError('invalid-argument', 'Provide targetEmail.');
  }

  let userRecord;
  try {
    userRecord = await admin.auth().getUserByEmail(targetEmail);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      userRecord = await admin.auth().createUser({ email: targetEmail, emailVerified: true });
    } else {
      throw new functions.https.HttpsError('not-found', 'User lookup failed.');
    }
  }

  const customClaims = { ...(userRecord.customClaims || {}) }; 
  customClaims.admin = true;
  customClaims.role = 'admin';
  customClaims.accessTier = data?.accessTier || customClaims.accessTier || 'executive';

  await admin.auth().setCustomUserClaims(userRecord.uid, customClaims);
  await updateUserRole(targetEmail, 'admin', customClaims.accessTier, data?.badges || []);
  await admin.database().ref('audits/adminGrants').push({
    grantedTo: targetEmail,
    grantedBy: context.auth.token.email || context.auth.uid,
    override: allowOverride,
    timestamp: Date.now()
  });

  return { uid: userRecord.uid, claims: customClaims };
});

exports.sendInviteEmail = functions.region(REGION).https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const authHeader = req.get('Authorization') || '';
    const match = authHeader.match(/^Bearer\s+(.*)$/);
    if (!match) {
      res.status(401).json({ error: 'Missing bearer token' });
      return;
    }

    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(match[1], true);
    } catch (err) {
      functions.logger.warn('Invalid invite token', err);
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    if (!decoded.admin) {
      res.status(403).json({ error: 'Admin privileges required' });
      return;
    }

  const { email, role = 'user', accessTier, message, baseUrl } = req.body || {};
    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }

    const metadata = {
      method: 'invite-link',
      overrides: {
        role,
        accessTier: accessTier || (role === 'guest' ? 'guest' : 'member')
      },
      issuer: decoded.email || decoded.uid,
      baseUrl: baseUrl || runtimeConfig.app?.signin_url
    };

    let magicLink;
    try {
      magicLink = await persistMagicLink(email, metadata);
    } catch (err) {
      functions.logger.error('Failed to create invite link', err);
      res.status(500).json({ error: 'Failed to create invite link' });
      return;
    }

    if (!SENDGRID_API_KEY) {
      res.status(200).json({
        delivered: false,
        reason: 'SendGrid API key not configured',
        inviteLink: magicLink.url,
        expiresAt: magicLink.expiresAt
      });
      return;
    }

    const inviter = decoded.email || 'admin@smarthubultra.dev';
    const plainMessage = message || `You've been invited to SmartHubUltra by ${inviter}. Use this link to join: ${magicLink.url}\n\nThe link expires soon, so please act promptly.`;

    const emailPayload = {
      to: email,
      from: SENDGRID_FROM,
      subject: 'Your SmartHubUltra Invite',
      text: plainMessage,
      html: `<p>You've been invited to <strong>SmartHubUltra</strong> by ${inviter}.</p><p><a href="${magicLink.url}">Complete your access</a></p><p>This link expires in minutes, so act promptly.</p>`
    };

    try {
      await sgMail.send(emailPayload);
      await admin.database().ref('audits/invites').push({
        email,
        role,
        accessTier: metadata.overrides.accessTier,
        issuer: inviter,
        delivered: true,
        timestamp: Date.now()
      });
      res.status(200).json({
        delivered: true,
        inviteLink: magicLink.url,
        expiresAt: magicLink.expiresAt
      });
    } catch (err) {
      functions.logger.error('SendGrid error', err);
      await admin.database().ref('audits/invites').push({
        email,
        role,
        accessTier: metadata.overrides.accessTier,
        issuer: inviter,
        delivered: false,
        error: err.message,
        timestamp: Date.now()
      });
      res.status(502).json({
        delivered: false,
        error: 'Invite email failed',
        inviteLink: magicLink.url,
        expiresAt: magicLink.expiresAt
      });
    }
  });
});

exports.cleanupAuthArtifacts = functions.region(REGION).pubsub.schedule('every 60 minutes').onRun(async () => {
  const db = admin.database();
  const now = Date.now();
  const magicLinksRef = db.ref('magicLinks');
  const sessionsRef = db.ref('sessions');
  const removed = { magicLinks: 0, guestUsers: 0, sessions: 0 };

  const expiredLinksSnap = await magicLinksRef.orderByChild('expiresAt').endAt(now).get();
  if (expiredLinksSnap.exists()) {
    const updates = {};
    expiredLinksSnap.forEach(child => {
      updates[child.key] = null;
      removed.magicLinks += 1;
    });
    await magicLinksRef.update(updates);
  }

  const guestCutoff = now - GUEST_TTL_MS;
  const guestSnap = await db.ref('users').orderByChild('role').equalTo('guest').get();
  if (guestSnap.exists()) {
    const userUpdates = {};
    guestSnap.forEach(child => {
      const value = child.val() || {};
      const created = value.guest?.createdAt || value.createdAt || 0;
      const lastSession = value.lastSessionAt || 0;
      if (created < guestCutoff && lastSession < guestCutoff) {
        userUpdates[child.key] = null;
        removed.guestUsers += 1;
      }
    });
    if (Object.keys(userUpdates).length) {
      await db.ref('users').update(userUpdates);
    }

    const sessionsToLoad = Object.keys(userUpdates);
    if (sessionsToLoad.length) {
      const sessionUserSet = new Set(sessionsToLoad);
      const sessionsSnap = await sessionsRef.get();
      if (sessionsSnap.exists()) {
        const sessionRemovals = {};
        sessionsSnap.forEach(child => {
          const session = child.val() || {};
          if (sessionUserSet.has(session.user) && (session.createdAt || 0) < (now - SESSION_TTL_MS)) {
            sessionRemovals[child.key] = null;
            removed.sessions += 1;
          }
        });
        if (Object.keys(sessionRemovals).length) {
          await sessionsRef.update(sessionRemovals);
        }
      }
    }
  }

  await db.ref('maintenanceLogs').push({
    ranAt: now,
    removed,
    guestCutoff,
    sessionTtl: SESSION_TTL_MS
  });

  return removed;
});
