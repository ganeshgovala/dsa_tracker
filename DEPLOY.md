# Deploying DSA Tracker

Firebase project: **ganeshcodetracker**

- **Firestore security rules** → deployed to Firebase (done ✅).
- **The app** → hosted on **Vercel** (free tier runs Next.js SSR + API routes
  natively; Firestore & Auth still point at your Firebase project).

Firebase's free "Spark" Hosting only serves static files, and its SSR options
(App Hosting / Cloud Functions) require the paid Blaze plan — so the app runs on
Vercel instead, for free.

---

## 1. Firestore rules (done)

```bash
firebase deploy --only firestore:rules
```

Re-run this whenever `firestore.rules` changes.

---

## 2. Deploy the app to Vercel

### a. Push to GitHub

```bash
git add -A
git commit -m "DSA tracker: login page, Admin seeding, deploy config"
# create an empty repo at github.com/new, then:
git remote add origin https://github.com/<you>/dsa-tracker.git
git push -u origin main
```

(`serviceAccountKey.json` and `.env.local` are gitignored — they won't be pushed.)

### b. Import into Vercel

- Go to <https://vercel.com/new> and **import** the GitHub repo.
- Framework preset auto-detects **Next.js** — leave build/output settings default.

### c. Add environment variables (Vercel → Project → Settings → Environment Variables)

These are the public Firebase web config (safe to expose; access is gated by
rules + Auth). Add each for **Production** (and Preview if you want):

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDeXBUO71GKHja4-7nv6mYnD--6NL3TLFg
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ganeshcodetracker.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ganeshcodetracker
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ganeshcodetracker.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=709091312180
NEXT_PUBLIC_FIREBASE_APP_ID=1:709091312180:web:83c44bdf64df36a5adc061
```

Then **Deploy**. Vercel gives you a URL like `https://dsa-tracker.vercel.app`.

> The Admin SDK (seed routes) isn't needed in production — the curriculum is
> already seeded, and the app reads Firestore with the public read rules. If you
> ever want `/api/seed/*` to work on Vercel, add a `FIREBASE_SERVICE_ACCOUNT`
> env var containing the full service-account JSON (one line). Otherwise those
> routes simply return 503, which is fine.

---

## 3. After the app is live (IMPORTANT)

**Authorize the Vercel domain for Google sign-in**, or login will fail:

- Firebase Console → **Authentication → Settings → Authorized domains → Add domain**
- Add your Vercel domain, e.g. `dsa-tracker.vercel.app` (and any custom domain).

---

## Notes

- `apphosting.yaml` and `.firebaserc` are Firebase-specific and unused by Vercel —
  harmless to leave in the repo (kept in case you switch to Blaze/App Hosting later).
- `scripts/reset-user-data.mjs` is a local maintenance tool (wipes user data, keeps
  curriculum). Not part of the deployed app.
