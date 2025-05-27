import { admin } from './firebase.js';

async function setAdminClaims() {
  try {
    const uid = 'uid-here'; // Add your user's UID here (Create user first in Firebase Console, then copy the UID here)
    
    await admin.auth().setCustomUserClaims(uid, {
      role: 'admin' 
    });
    
    console.log(`Admin claims set successfully for user: ${uid}`);
    
    const user = await admin.auth().getUser(uid);
    console.log('Custom claims:', user.customClaims);
    
  } catch (error) {
    console.error('Error setting admin claims:', error);
  } finally {
    process.exit(0);
  }
}

setAdminClaims();