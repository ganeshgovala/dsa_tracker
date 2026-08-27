import { NextResponse } from "next/server";
import { adminSeedPhases } from "@/lib/roadmap/admin-seed";
import { isAdminConfigured } from "@/lib/firebase-admin";
import { handleRouteError } from "@/lib/roadmap/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/seed/phases — idempotently seed the 8 roadmap phases.
 * Writes via the Admin SDK, so it bypasses Firestore security rules.
 */
export async function POST() {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      {
        error:
          "Firebase Admin not configured. Set FIREBASE_SERVICE_ACCOUNT_PATH " +
          "(path to your service-account key JSON) in .env.local.",
      },
      { status: 503 },
    );
  }
  try {
    const result = await adminSeedPhases();
    return NextResponse.json({ seeded: true, ...result });
  } catch (err) {
    return handleRouteError(err);
  }
}
