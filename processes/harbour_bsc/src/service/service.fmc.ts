import admin from 'firebase-admin';
import { BatchResponse } from 'firebase-admin/lib/messaging';

class CMCNotificationService {
  private messaging: admin.messaging.Messaging;
  private serviceAccount: any

  constructor() {
    this.serviceAccount = require('../../firebase-admin.json');
    this.initializeFirebase();
    this.messaging = admin.messaging();
  }

  // Initialize Firebase Admin SDK with error handling
  private initializeFirebase() {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(this.serviceAccount),
      });
      console.log("Firebase Admin SDK initialized.");
    } catch (error) {
      console.error("Error initializing Firebase Admin SDK:", error);
      throw new Error("Failed to initialize Firebase Admin SDK.");
    }
  }

  // Send a notification to multiple recipients
  public async sendNotification(message: any): Promise<void> {
    console.log("🚀 ~ Sending Notification ~ message:", message);
    try {

      const response: BatchResponse = await this.messaging.sendEachForMulticast(message);
      console.log("💥🚀 ~ Notification sent successfully:", JSON.stringify(response));
    } catch (err: any) {
      console.error("Error sending notification:", err.message || err);
    }
  }
}

export default new CMCNotificationService();