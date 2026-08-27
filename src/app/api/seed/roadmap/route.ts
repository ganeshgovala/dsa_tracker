import { NextResponse } from "next/server";
import { adminImportPhaseData } from "@/lib/roadmap/admin-seed";
import { isAdminConfigured } from "@/lib/firebase-admin";
import type { ImportedPhase, ImportResult } from "@/lib/roadmap/import-types";
import { BUNDLED_PAYLOADS } from "@/lib/roadmap/data";
import { handleRouteError } from "@/lib/roadmap/http";
import { ValidationError } from "@/lib/roadmap/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/seed/roadmap — idempotently imports phase payloads
 * (phase → topics → problems).
 *
 * Body forms:
 *   (none)                  → imports all bundled payloads (currently Phase 1)
 *   { ...single payload }   → imports that payload
 *   [payload, ...]          → imports each payload in order
 *   { payloads: [...] }     → imports each payload in order
 */
export async function POST(request: Request) {
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
    const text = await request.text();
    let payloads: ImportedPhase[];
    if (text.trim() === "") {
      payloads = BUNDLED_PAYLOADS;
    } else {
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new ValidationError("Invalid JSON request body");
      }
      if (Array.isArray(parsed)) payloads = parsed as ImportedPhase[];
      else if (
        typeof parsed === "object" &&
        parsed !== null &&
        Array.isArray((parsed as { payloads?: unknown }).payloads)
      )
        payloads = (parsed as { payloads: ImportedPhase[] }).payloads;
      else payloads = [parsed as ImportedPhase];
    }

    const results: ImportResult[] = [];
    for (const payload of payloads) {
      results.push(await adminImportPhaseData(payload));
    }

    const totals = results.reduce(
      (acc, r) => ({
        topicsCreated: acc.topicsCreated + r.topicsCreated,
        topicsUpdated: acc.topicsUpdated + r.topicsUpdated,
        problemsCreated: acc.problemsCreated + r.problemsCreated,
        problemsUpdated: acc.problemsUpdated + r.problemsUpdated,
      }),
      {
        topicsCreated: 0,
        topicsUpdated: 0,
        problemsCreated: 0,
        problemsUpdated: 0,
      },
    );
    return NextResponse.json({
      imported: true,
      phases: results.length,
      ...totals,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
