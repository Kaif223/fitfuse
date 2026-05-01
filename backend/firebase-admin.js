const admin = require('firebase-admin');

// 🔴 Download your service account key from Firebase Console:
// Firebase Console → Project Settings → Service Accounts → Generate New Private Key
// Save the file as 'serviceAccountKey.json' inside the backend folder
// NEVER commit this file to GitHub — add it to .gitignore

let db, storage;

try {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
  db = admin.firestore();
  storage = admin.storage();
  console.log('✅ Firebase Admin connected');
} catch (e) {
  console.warn('⚠️  Firebase Admin not configured yet. Add serviceAccountKey.json to backend folder.');
  // Mock db for testing without Firebase
  db = null;
  storage = null;
}

module.exports = { admin, db, storage };
