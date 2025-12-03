/**
 * Login Metrics Module
 * Tracks user authentication events, email sending, and app navigation.
 * Provides centralized logging for debugging and analytics.
 */

import { dbRef, set, update, get } from './firebaseConfig.js';
import { logActivity } from './utils.js';

// Constants for metric types
const METRIC_TYPES = {
  LOGIN_ATTEMPT: 'login_attempt',
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILURE: 'login_failure',
  EMAIL_SENT: 'email_sent',
  EMAIL_FAILED: 'email_failed',
  APP_PROCEED: 'app_proceed',
  SESSION_CREATED: 'session_created'
};

// Constants for delivery methods
const DELIVERY_METHODS = {
  FIREBASE: 'firebase',
  SENDGRID: 'sendgrid',
  LINK_ONLY: 'link-only',
  MAIL_CLIENT_FALLBACK: 'mail-client-fallback'
};

// Counter for ensuring unique IDs within the same millisecond
let idCounter = 0;

/**
 * Generates a unique metric ID with better collision resistance
 * @returns {string} A unique metric ID
 */
function generateMetricId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 10);
  const counter = (idCounter++ % 1000).toString().padStart(3, '0');
  return `metric_${timestamp}_${counter}_${random}`;
}

/**
 * Records a login metric event to the database
 * @param {string} type - The metric type from METRIC_TYPES
 * @param {Object} data - Additional data about the event
 * @returns {Promise<Object>} The recorded metric object
 */
async function recordMetric(type, data = {}) {
  const metric = {
    id: generateMetricId(),
    type,
    timestamp: Date.now(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    ...data
  };

  try {
    await set(dbRef(`loginMetrics/${metric.id}`), metric);
    console.info(`[LoginMetrics] Recorded: ${type}`, metric);
  } catch (err) {
    console.error(`[LoginMetrics] Failed to record ${type}:`, err);
    // Continue execution even if metric recording fails
  }

  return metric;
}

/**
 * Tracks a login attempt (when user initiates sign-in)
 * @param {string} email - User's email
 * @param {string} method - Login method (email-link, magic-link, guest, project-code, admin-fastpass)
 * @returns {Promise<Object>} The recorded metric
 */
export async function trackLoginAttempt(email, method) {
  const sanitizedEmail = (email || '').toLowerCase();
  const metric = await recordMetric(METRIC_TYPES.LOGIN_ATTEMPT, {
    email: sanitizedEmail,
    method,
    source: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
  });
  
  logActivity('Login attempt', { email: sanitizedEmail, method });
  return metric;
}

/**
 * Tracks a successful login event
 * @param {string} userKey - The sanitized user key
 * @param {string} email - User's email
 * @param {string} method - Login method used
 * @param {Object} additionalData - Any additional data to track
 * @returns {Promise<Object>} The recorded metric
 */
export async function trackLoginSuccess(userKey, email, method, additionalData = {}) {
  const metric = await recordMetric(METRIC_TYPES.LOGIN_SUCCESS, {
    userKey,
    email: (email || '').toLowerCase(),
    method,
    ...additionalData
  });

  // Update user's login metrics summary
  try {
    const userMetricsRef = dbRef(`users/${userKey}/loginMetrics`);
    const snap = await get(userMetricsRef);
    const existing = snap.exists() ? snap.val() : {};
    
    await update(userMetricsRef, {
      totalLogins: (existing.totalLogins || 0) + 1,
      lastLoginAt: Date.now(),
      lastLoginMethod: method,
      loginMethods: {
        ...(existing.loginMethods || {}),
        [method]: ((existing.loginMethods || {})[method] || 0) + 1
      }
    });
  } catch (err) {
    console.warn('[LoginMetrics] Failed to update user login metrics:', err);
  }

  logActivity('Login success', { userKey, method });
  return metric;
}

/**
 * Tracks a failed login event
 * @param {string} email - User's email (if available)
 * @param {string} method - Login method attempted
 * @param {string} reason - Reason for failure
 * @param {Error} error - The error object (if available)
 * @returns {Promise<Object>} The recorded metric
 */
export async function trackLoginFailure(email, method, reason, error = null) {
  const metric = await recordMetric(METRIC_TYPES.LOGIN_FAILURE, {
    email: (email || '').toLowerCase(),
    method,
    reason,
    errorMessage: error?.message || null,
    errorCode: error?.code || null
  });

  logActivity('Login failure', { email, method, reason });
  return metric;
}

/**
 * Tracks email sending success
 * @param {string} email - Recipient email
 * @param {string} emailType - Type of email (sign-in, invite, etc.)
 * @param {string} deliveryMethod - How it was sent (firebase, sendgrid, fallback)
 * @returns {Promise<Object>} The recorded metric
 */
export async function trackEmailSent(email, emailType, deliveryMethod) {
  const metric = await recordMetric(METRIC_TYPES.EMAIL_SENT, {
    recipientEmail: (email || '').toLowerCase(),
    emailType,
    deliveryMethod
    // Note: timestamp is already set in the base metric object
  });

  logActivity('Email sent', { email, emailType, deliveryMethod });
  return metric;
}

/**
 * Tracks email sending failure
 * @param {string} email - Recipient email
 * @param {string} emailType - Type of email attempted
 * @param {string} reason - Reason for failure
 * @param {Error} error - The error object (if available)
 * @returns {Promise<Object>} The recorded metric
 */
export async function trackEmailFailed(email, emailType, reason, error = null) {
  const metric = await recordMetric(METRIC_TYPES.EMAIL_FAILED, {
    recipientEmail: (email || '').toLowerCase(),
    emailType,
    reason,
    errorMessage: error?.message || null,
    errorCode: error?.code || null
  });

  logActivity('Email failed', { email, emailType, reason });
  return metric;
}

/**
 * Tracks when user successfully proceeds to the app
 * @param {string} userKey - The sanitized user key
 * @param {string} destination - Where the user navigated to (dashboard, etc.)
 * @param {string} fromMethod - The login method that got them here
 * @returns {Promise<Object>} The recorded metric
 */
export async function trackAppProceed(userKey, destination, fromMethod) {
  const metric = await recordMetric(METRIC_TYPES.APP_PROCEED, {
    userKey,
    destination,
    fromMethod
    // Note: timestamp is already set in the base metric object
  });

  logActivity('User proceeded to app', { userKey, destination, fromMethod });
  return metric;
}

/**
 * Tracks session creation
 * @param {string} sessionId - The created session ID
 * @param {string} userKey - The user's key
 * @param {string} method - How the session was created
 * @returns {Promise<Object>} The recorded metric
 */
export async function trackSessionCreated(sessionId, userKey, method) {
  const metric = await recordMetric(METRIC_TYPES.SESSION_CREATED, {
    sessionId,
    userKey,
    method
    // Note: timestamp is already set in the base metric object
  });

  logActivity('Session created', { sessionId, userKey, method });
  return metric;
}

/**
 * Gets login metrics summary for a user
 * @param {string} userKey - The user's key
 * @returns {Promise<Object|null>} The user's login metrics or null
 */
export async function getUserLoginMetrics(userKey) {
  try {
    const snap = await get(dbRef(`users/${userKey}/loginMetrics`));
    return snap.exists() ? snap.val() : null;
  } catch (err) {
    console.error('[LoginMetrics] Failed to get user metrics:', err);
    return null;
  }
}

/**
 * Handles the complete login flow with metrics tracking
 * This is a convenience function that tracks the entire flow
 * @param {Object} options - Login flow options
 * @returns {Promise<{success: boolean, shouldProceed: boolean, error?: string}>}
 */
export async function handleLoginWithMetrics({
  email,
  method,
  onLoginAttempt,
  onEmailSend,
  onLoginComplete,
  onProceedToApp
}) {
  const result = { success: false, shouldProceed: false, error: null };

  try {
    // Track the login attempt
    await trackLoginAttempt(email, method);

    // Execute the login attempt callback if provided
    if (typeof onLoginAttempt === 'function') {
      await onLoginAttempt();
    }

    // Handle email sending if callback provided
    if (typeof onEmailSend === 'function') {
      try {
        const emailResult = await onEmailSend();
        if (emailResult?.sent) {
          await trackEmailSent(email, 'sign-in', emailResult.method || DELIVERY_METHODS.FIREBASE);
        }
      } catch (emailErr) {
        await trackEmailFailed(email, 'sign-in', emailErr.message, emailErr);
        // Continue even if email fails - user can use fallback link
      }
    }

    // Execute login completion if callback provided
    if (typeof onLoginComplete === 'function') {
      const loginResult = await onLoginComplete();
      if (loginResult?.userKey) {
        await trackLoginSuccess(loginResult.userKey, email, method);
        result.success = true;

        // Check if user should proceed to app
        if (loginResult.shouldProceed !== false) {
          result.shouldProceed = true;
          if (typeof onProceedToApp === 'function') {
            await onProceedToApp();
            await trackAppProceed(loginResult.userKey, 'dashboard', method);
          }
        }
      }
    } else {
      // If no completion callback, mark as success for sign-in link flows
      result.success = true;
    }

  } catch (err) {
    console.error('[LoginMetrics] Login flow error:', err);
    await trackLoginFailure(email, method, err.message, err);
    result.error = err.message;
  }

  return result;
}

// Export metric types and delivery methods for external use
export { METRIC_TYPES, DELIVERY_METHODS };
