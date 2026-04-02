// src/config/firebaseAdmin.ts
import admin from 'firebase-admin';

// Guard against re-initialization during Next.js hot reload
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // .env stores private key with literal \n — replace before passing to SDK
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    // Required if you use Firebase Realtime Database server-side
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });
}

export const adminAuth = admin.auth();
export const adminDb = admin.database(); // server-side Realtime DB access if needed
