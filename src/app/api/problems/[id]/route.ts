import { NextResponse } from "next/server";
import {
  deleteProblem,
  getProblem,
  updateProblem,
} from "@/lib/roadmap/firestore";
import { handleRouteError, readJsonBody } from "@/lib/roadmap/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/problems/{id} — fetch a single problem. */
export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const problem = await getProblem(id);
    if (!problem) {
      return NextResponse.json(
        { error: `Problem "${id}" not found` },
        { status: 404 },
      );
    }
    return NextResponse.json({ problem });
  } catch (err) {
    return handleRouteError(err);
  }
}

/** PATCH /api/problems/{id} — update mutable problem fields. */
export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await readJsonBody(request);
    return NextResponse.json({ problem: await updateProblem(id, body) });
  } catch (err) {
    return handleRouteError(err);
  }
}

/** DELETE /api/problems/{id}. */
export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    await deleteProblem(id);
    return NextResponse.json({ deleted: id });
  } catch (err) {
    return handleRouteError(err);
  }
}
