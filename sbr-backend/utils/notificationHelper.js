const admin = require('firebase-admin');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

let firebaseInitialized = false;

// Path to Firebase Service Account JSON file (user should upload this to their VPS)
const serviceAccountPath = path.join(__dirname, '../config/firebase-service-account.json');

if (fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin SDK initialized successfully.');
    firebaseInitialized = true;
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error.message);
  }
} else {
  console.log('Notice: firebase-service-account.json not found in config/. Push notifications will be logged to console in local fallback mode.');
}

/**
 * Send FCM push notification to a specific user
 * @param {string} userId - Target User ID
 * @param {object} payload - Notification payload { title, body, data }
 */
const sendNotificationToUser = async (userId, payload) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      console.log(`No active FCM tokens found for user ${userId}. Payload:`, payload);
      return;
    }

    const { title, body, data } = payload;

    if (!firebaseInitialized) {
      console.log(`[Push Fallback] Sending to user ${user.name} (${userId}):`);
      console.log(` - Title: ${title}`);
      console.log(` - Body: ${body}`);
      console.log(` - Tokens Count: ${user.fcmTokens.length}`);
      return;
    }

    // Build FCM messaging payload
    const message = {
      notification: {
        title,
        body
      },
      data: data || {},
      tokens: user.fcmTokens
    };

    // Send notification
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`FCM Notifications sent: ${response.successCount} success, ${response.failureCount} failed.`);
    
    // Clean up failed tokens if there are invalid registration errors
    if (response.failureCount > 0) {
      const activeTokens = [];
      response.responses.forEach((resp, index) => {
        if (resp.success) {
          activeTokens.push(user.fcmTokens[index]);
        } else if (
          resp.error.code === 'messaging/invalid-registration-token' ||
          resp.error.code === 'messaging/registration-token-not-registered'
        ) {
          console.log(`Pruning expired FCM token: ${user.fcmTokens[index]}`);
        } else {
          // Keep other errors
          activeTokens.push(user.fcmTokens[index]);
        }
      });
      user.fcmTokens = activeTokens;
      await user.save();
    }
  } catch (error) {
    console.error('Error sending push notifications:', error.message);
  }
};

module.exports = { sendNotificationToUser };
