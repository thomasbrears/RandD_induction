import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

//const serviceAccount = JSON.parse(readFileSync('./r-and-d-induction-firebase-adminsdk-pf2gf-d8e0622e57.json'));

//admin.initializeApp({
  //credential: admin.credential.cert(serviceAccount), 
  //projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,  
//});

//Firebase service account key
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
  storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,  
});

export const db = admin.firestore();
