const admin = require('firebase-admin');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

let firebaseInitialized = false;

/**
 * Initialize Firebase Admin SDK using the first valid credential found:
 * 1. Default JSON file: config/firebase-service-account.json
 * 2. File specified in FIREBASE_CONFIG_PATH or GOOGLE_APPLICATION_CREDENTIALS
 * 3. Raw or base64 JSON string in FIREBASE_SERVICE_ACCOUNT
 * 4. Granular env vars: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 */
function initFirebase() {
  if (admin.apps.length > 0) {
    firebaseInitialized = true;
    return;
  }

  // 1. Check default config path or env path
  const defaultPath = path.join(__dirname, '../config/firebase-service-account.json');
  const envPath = process.env.FIREBASE_CONFIG_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const targetPath = (envPath && fs.existsSync(envPath)) ? envPath : (fs.existsSync(defaultPath) ? defaultPath : null);

  if (targetPath) {
    try {
      const serviceAccount = require(targetPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase Admin SDK initialized successfully from file:', targetPath);
      firebaseInitialized = true;
      return;
    } catch (err) {
      console.error('Error initializing Firebase Admin SDK from file:', err.message);
    }
  }

  // 2. Check JSON string or Base64 in FIREBASE_SERVICE_ACCOUNT env var
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      let raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
      if (!raw.startsWith('{')) {
        raw = Buffer.from(raw, 'base64').toString('utf8');
      }
      const serviceAccount = JSON.parse(raw);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase Admin SDK initialized successfully from FIREBASE_SERVICE_ACCOUNT env var.');
      firebaseInitialized = true;
      return;
    } catch (err) {
      console.error('Error parsing FIREBASE_SERVICE_ACCOUNT env var:', err.message);
    }
  }

  // 3. Check individual FIREBASE_* env variables
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        })
      });
      console.log('Firebase Admin SDK initialized successfully from individual env variables.');
      firebaseInitialized = true;
      return;
    } catch (err) {
      console.error('Error initializing Firebase from individual env vars:', err.message);
    }
  }

  console.log('Notice: Firebase credentials not found (checked config/firebase-service-account.json and .env). Push notifications will run in fallback console mode.');
}

initFirebase();

/**
 * Send FCM push notification to a specific user
 * Supports both signatures:
 *  - sendNotificationToUser(userId, { title, body, data })
 *  - sendPushNotification(userOrId, title, body, data)
 *
 * @param {string|object} userOrId - Target User ID or User document
 * @param {string|object} titleOrPayload - Notification title or full payload object
 * @param {string} [bodyParam] - Notification body (if titleOrPayload is a string)
 * @param {object} [dataParam] - Additional metadata for the notification
 */
const sendNotificationToUser = async (userOrId, titleOrPayload, bodyParam, dataParam) => {
  try {
    let title, body, data;
    if (typeof titleOrPayload === 'object' && titleOrPayload !== null) {
      title = titleOrPayload.title || '';
      body = titleOrPayload.body || '';
      data = titleOrPayload.data || {};
    } else {
      title = titleOrPayload || '';
      body = bodyParam || '';
      data = dataParam || {};
    }

    let user;
    if (userOrId && typeof userOrId === 'object' && Array.isArray(userOrId.fcmTokens)) {
      user = userOrId;
    } else {
      const id = (userOrId && typeof userOrId === 'object' && (userOrId._id || userOrId.id))
        ? (userOrId._id || userOrId.id)
        : userOrId;
      user = await User.findById(id);
    }

    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      console.log(`No active FCM tokens found for user ${user ? (user.name || user._id) : userOrId}. Title: "${title}"`);
      return;
    }

    // Deduplicate active tokens
    const tokens = [...new Set(user.fcmTokens.filter(t => typeof t === 'string' && t.trim().length > 0))];
    if (tokens.length === 0) {
      return;
    }

    // Ensure all data values are string types (FCM Multicast strict requirement)
    const sanitizedData = {};
    if (data && typeof data === 'object') {
      for (const [k, v] of Object.entries(data)) {
        if (v !== undefined && v !== null) {
          sanitizedData[k] = typeof v === 'string' ? v : String(v);
        }
      }
    }
    if (title && !sanitizedData.title) sanitizedData.title = String(title);
    if (body && !sanitizedData.body) sanitizedData.body = String(body);

    if (!firebaseInitialized) {
      console.log(`[Push Fallback] Target: ${user.name || user._id} (${tokens.length} tokens)`);
      console.log(` - Title: ${title}`);
      console.log(` - Body: ${body}`);
      console.log(` - Data:`, sanitizedData);
      return;
    }

    // Resolve channelId matching Android MyFirebaseMessagingService channels
    const typeUpper = (sanitizedData.type || '').toUpperCase();
    let channelId = 'sbr_dispatch';
    if (typeUpper.includes('HANDOVER') || typeUpper.includes('PAYMENT') || typeUpper.includes('REWARD') || typeUpper.includes('CLAIM')) {
      channelId = 'sbr_finance';
    } else if (typeUpper.includes('INDENT') || typeUpper.includes('STOCK')) {
      channelId = 'sbr_inventory';
    } else if (typeUpper.includes('UPDATE') || typeUpper.includes('NOTICE')) {
      channelId = 'sbr_updates';
    }
    if (sanitizedData.channelId) {
      channelId = sanitizedData.channelId;
    } else {
      sanitizedData.channelId = channelId;
    }

    // Build unified FCM Multicast message
    const message = {
      notification: {
        title,
        body
      },
      android: {
        priority: 'high',
        notification: {
          channelId,
          sound: 'default',
          priority: 'high',
          defaultSound: true,
          defaultVibrateTimings: true
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      },
      data: sanitizedData,
      tokens
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`FCM sent to ${user.name || user._id}: ${response.successCount} succeeded, ${response.failureCount} failed.`);

    // Clean up expired or unregistered tokens
    if (response.failureCount > 0) {
      const validTokens = [];
      response.responses.forEach((resp, idx) => {
        if (resp.success) {
          validTokens.push(tokens[idx]);
        } else if (
          resp.error && (
            resp.error.code === 'messaging/invalid-registration-token' ||
            resp.error.code === 'messaging/registration-token-not-registered'
          )
        ) {
          console.log(`Pruning expired FCM token: ${tokens[idx]}`);
        } else {
          validTokens.push(tokens[idx]);
        }
      });
      user.fcmTokens = validTokens;
      await user.save();
    }
  } catch (error) {
    console.error('Error sending push notification:', error.message);
  }
};

const sendPushNotification = sendNotificationToUser;

/**
 * Send FCM push notification to all users with specific roles (e.g. ['ADMIN', 'STORE_INCHARGE'])
 * @param {string|string[]} roles 
 * @param {string|object} payload 
 * @param {string} [bodyParam]
 * @param {object} [dataParam]
 */
const sendNotificationToRole = async (roles, payload, bodyParam, dataParam) => {
  try {
    const roleList = Array.isArray(roles) ? roles : [roles];
    const regexList = roleList.map(r => new RegExp('^' + r + '$', 'i'));
    const users = await User.find({
      role: { $in: regexList },
      fcmTokens: { $exists: true, $not: { $size: 0 } }
    });

    for (const u of users) {
      await sendNotificationToUser(u, payload, bodyParam, dataParam);
    }
  } catch (error) {
    console.error('Error sending role push notifications:', error.message);
  }
};

module.exports = {
  sendNotificationToUser,
  sendPushNotification,
  sendNotificationToRole
};

