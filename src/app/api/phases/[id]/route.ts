import { NextResponse } from "next/server";
import {
  deletePhase,
  getPhaseWithTopics,
  updatePhase,
} from "@/lib/roadmap/firestore";
import { handleRouteError, readJsonBody } from "@/lib/roadmap/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/phases/{id} — a phase with its topics.
 * Add `?include=problems` to embed each topic's ordered problems.
 */
export async function GET(request: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const includeProblems =
      new URL(request.url).searchParams.get("include") === "problems";
    const phase = await getPhaseWithTopics(id, includeProblems);
    if (!phase) {
      return NextResponse.json({ error: `Phase "${id}" not found` }, { status: 404 });
    }
    return NextResponse.json({ phase });
  } catch (err) {
    return handleRouteError(err);
  }
}

/** PATCH /api/phases/{id} — update mutable phase fields. */
export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await readJsonBody(request);
    return NextResponse.json({ phase: await updatePhase(id, body) });
  } catch (err) {
    return handleRouteError(err);
  }
}

/** DELETE /api/phases/{id} — deletes the phase and cascades topics + problems. */
export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    await deletePhase(id);
    return NextResponse.json({ deleted: id });
  } catch (err) {
    return handleRouteError(err);
  }
}
