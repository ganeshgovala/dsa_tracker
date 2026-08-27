import { readFileSync } from "node:fs";
import {
  cert,
  getApps,
  initializeApp,
  type App,
  type Credential,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Firebase ADMIN SDK — server-only (imported only by /api route handlers).
 *
 * Unlike the client Web SDK in `firebase.ts`, the Admin SDK authenticates with
 * a service account and BYPASSES Firestore security rules. The seed routes use
 * it so seeding writes succeed while client-facing rules stay locked
 * (`roadmap_* write: if false`).
 *
 * Credentials, in priority order:
 *   1. FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json   (local dev)
 *   2. FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}   (inline JSON)
 *   3. Application Default Credentials — used automatically on Firebase App
 *      Hosting / Cloud Run (the backend service account); no key file needed.
 *
 * Get a key from: Firebase Console → Project Settings → Service Accounts →
 * "Generate new private key". The file is gitignored — never commit it.
 */

const ADMIN_APP_NAME = "admin";

/** True when credentials are available (explicit env, or a Google runtime with ADC). */
export function isAdminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
      process.env.FIREBASE_SERVICE_ACCOUNT ||
      // Google-managed runtimes provide Application Default Credentials.
      process.env.K_SERVICE ||
      process.env.GOOGLE_CLOUD_PROJECT,
  );
}

/**
 * Explicit service-account credential from env, or `undefined` to fall back to
 * Application Default Credentials.
 */
function explicitCredential(): Credential | undefined {
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT;
  const raw = path ? readFileSync(path, "utf8") : inline;
  if (!raw) return undefined;

  let parsed: Record<string, string>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      "Firebase Admin credential is not valid JSON: " +
        (path
          ? `check the file at FIREBASE_SERVICE_ACCOUNT_PATH (${path}).`
          : "check FIREBASE_SERVICE_ACCOUNT."),
    );
  }

  // Accept the raw service-account JSON (snake_case). `private_key` may contain
  // escaped newlines when stored inline in an env var — normalise them.
  return cert({
    projectId: parsed.project_id ?? parsed.projectId,
    clientEmail: parsed.client_email ?? parsed.clientEmail,
    privateKey: (parsed.private_key ?? parsed.privateKey)?.replace(/\\n/g, "\n"),
  });
}

let cachedDb: Firestore | undefined;

/** Lazily-initialised Admin Firestore. */
export function getAdminDb(): Firestore {
  if (cachedDb) return cachedDb;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const existing = getApps().find((a) => a.name === ADMIN_APP_NAME);
  const credential = existing ? undefined : explicitCredential();
  const app: App =
    existing ??
    initializeApp(
      // No explicit credential → Admin SDK uses Application Default Credentials
      // (the App Hosting / Cloud Run service account).
      credential ? { credential, projectId } : { projectId },
      ADMIN_APP_NAME,
    );
  cachedDb = getFirestore(app);
  return cachedDb;
}
