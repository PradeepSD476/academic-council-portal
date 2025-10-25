import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin SDK Initialized Successfully.');
} catch (error) {
  console.error('Firebase Admin SDK Initialization Error:', error);
}

export default admin; 