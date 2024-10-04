import admin from 'firebase-admin';
import serviceAccount from "./r-and-d-induction-firebase-adminsdk-pf2gf-d8e0622e57.json" assert { type: 'json' };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount), 
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,  
});

export const db = admin.firestore();
