// Server-only Firebase Admin SDK initialization.
// Used exclusively to verify the Firebase ID token sent from the client
// before we mint our own JWT session cookie. Never import this from a
// client component.

import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Requires these server-only env vars (from a Firebase service account key):
//   FIREBASE_ADMIN_PROJECT_ID
//   FIREBASE_ADMIN_CLIENT_EMAIL
//   FIREBASE_ADMIN_PRIVATE_KEY   (keep newlines escaped as \n in .env)

function getAdminApp(): App {
  if (getApps().length) return getApps()[0];

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

/** Verify a Firebase ID token from the client, returning its decoded claims. */
export async function verifyFirebaseIdToken(idToken: string) {
  const app = getAdminApp();
  return getAuth(app).verifyIdToken(idToken);
}
