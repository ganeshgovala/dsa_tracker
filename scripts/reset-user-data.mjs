// One-off maintenance script (run with Node, NOT part of the app).
//
//   node scripts/reset-user-data.mjs            -> inventory only (read-only)
//   node scripts/reset-user-data.mjs --delete   -> DELETE user data
//
// Deletes user-generated data (progress, friends, profiles) while leaving the
// roadmap curriculum (roadmap_phases / roadmap_topics / roadmap_problems)
// untouched. Uses the Admin SDK, so it bypasses security rules.

import { readFileSync } from "node:fs";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const KEY_PATH =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ?? "./serviceAccountKey.json";

// Collections that hold USER data — safe to wipe for a "start from scratch".
const USER_COLLECTIONS = ["user_progress", "user_friends", "users"];
// Kept for reference — NOT touched:
const KEEP = ["roadmap_phases", "roadmap_topics", "roadmap_problems"];

const sa = JSON.parse(readFileSync(KEY_PATH, "utf8"));
const app = initializeApp({
  credential: cert({
    projectId: sa.project_id,
    clientEmail: sa.client_email,
    privateKey: sa.private_key,
  }),
  projectId: sa.project_id,
});
const db = getFirestore(app);

const doDelete = process.argv.includes("--delete");

console.log(`Project: ${sa.project_id}`);
console.log(`Mode: ${doDelete ? "DELETE" : "inventory (read-only)"}\n`);

console.log("Keeping (curriculum):");
for (const name of KEEP) {
  const snap = await db.collection(name).count().get();
  console.log(`  ${name}: ${snap.data().count} docs (kept)`);
}

console.log("\nUser data:");
for (const name of USER_COLLECTIONS) {
  const refs = await db.collection(name).listDocuments();
  console.log(`  ${name}: ${refs.length} top-level docs`);
}

if (!doDelete) {
  console.log("\nRead-only. Re-run with --delete to remove the user data above.");
  process.exit(0);
}

console.log("\nDeleting user data...");
for (const name of USER_COLLECTIONS) {
  await db.recursiveDelete(db.collection(name));
  console.log(`  cleared ${name}`);
}
console.log("\nDone. User data removed; curriculum left intact.");
process.exit(0);
