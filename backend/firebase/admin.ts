import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage, Storage } from "firebase-admin/storage";

let app: App;

function normalizePrivateKey(raw: string | undefined): string | undefined {
  if (!raw) return raw;
  let k = raw.trim();
  // Vercel env vars are plain strings; people often paste with surrounding quotes from .env files.
  if (
    (k.startsWith('"') && k.endsWith('"')) ||
    (k.startsWith("'") && k.endsWith("'"))
  ) {
    k = k.slice(1, -1);
  }
  // Convert escaped newlines to real ones.
  k = k.replace(/\\n/g, "\n");
  return k;
}

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0]!;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey =
    process.env.FIREBASE_PRIVATE_KEY_BASE64
      ? Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, "base64").toString("utf8")
      : normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY (or FIREBASE_PRIVATE_KEY_BASE64)."
    );
  }

  app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    storageBucket,
  });

  return app;
}

export function getDb(): Firestore {
  return getFirestore(getAdminApp());
}

export function getBucket(): ReturnType<Storage["bucket"]> {
  return getStorage(getAdminApp()).bucket();
}
