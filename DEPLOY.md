# Deploying DSA Tracker to Firebase

Project: **ganeshcodetracker**

Two things get deployed:

1. **Firestore security rules** — from `firestore.rules` (quick).
2. **The app itself** — via **Firebase App Hosting** (the app is server-rendered,
   so plain static Hosting won't work).

Everything below is run by **you**, because `firebase login` needs an
interactive browser sign-in. The config files are already in the repo
(`firebase.json`, `.firebaserc`, `apphosting.yaml`).

---

## 0. One-time prerequisites

```bash
npm install -g firebase-tools     # install the CLI
firebase login                    # opens a browser to authenticate
```

- **Billing:** App Hosting requires the project to be on the **Blaze
  (pay-as-you-go)** plan. Firestore-rules deploy works on the free Spark plan.
  Upgrade at: Firebase Console → ⚙ → Usage and billing → Modify plan.

---

## 1. Deploy the Firestore rules

```bash
firebase deploy --only firestore:rules
```

That's it — your locked rules (`roadmap_* read: if true / write: if false`,
per-user data owner-only) go live.

---

## 2. Deploy the app (Firebase App Hosting)

App Hosting builds from a **GitHub repo**, so the project must be pushed to
GitHub first.

**a. Push to GitHub** (if not already):

```bash
git add -A && git commit -m "Prepare for Firebase App Hosting"
# create a repo on github.com, then:
git remote add origin https://github.com/<you>/dsa-tracker.git
git push -u origin main
```

**b. Create the App Hosting backend** — easiest in the console:

- Firebase Console → **Build → App Hosting → Get started**
- Connect your GitHub repo, pick the branch (e.g. `main`), region.
- It auto-detects Next.js and reads **`apphosting.yaml`** for env vars.
- First rollout builds and deploys; every push after that redeploys.

(CLI alternative: `firebase apphosting:backends:create --project ganeshcodetracker`.)

**c. Config already handled for you:**

- `apphosting.yaml` provides the `NEXT_PUBLIC_FIREBASE_*` values at build +
  runtime. (These are public web config — safe to commit.)
- The **Admin SDK** (`src/lib/firebase-admin.ts`) falls back to **Application
  Default Credentials** in App Hosting, so **no service-account key is needed in
  production** — it uses the backend's own service account.

---

## 3. After the app is live (IMPORTANT)

1. **Authorize the domain for Google sign-in.** Copy your App Hosting URL
   (e.g. `https://dsa-tracker--ganeshcodetracker.<region>.hosted.app`) and add it
   under: Firebase Console → **Authentication → Settings → Authorized domains**.
   Google sign-in will fail on the live site until you do this.

2. **(Optional) Seeding in prod.** The curriculum is already seeded in Firestore,
   so you normally don't need to. If you ever do, the App Hosting service account
   needs the **Cloud Datastore User** role (grant in Google Cloud Console → IAM)
   for the `/api/seed/*` routes to write via ADC.

---

## Notes

- `serviceAccountKey.json` is **local-only** and gitignored. Production uses ADC —
  do not commit the key.
- `scripts/reset-user-data.mjs` is a local maintenance tool (wipes user data,
  keeps curriculum). Not part of the deployed app.
