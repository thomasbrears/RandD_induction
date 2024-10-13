import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

// Parse the service account JSON from the environment variable
const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT.replace(/\\n/g, '\n') // Replace escaped newlines with actual newlines
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
  storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
  projectId: process.env.FIREBASE_PROJECT_ID,  
});

export const db = admin.firestore();