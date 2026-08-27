import { NextResponse } from "next/server";
import { createPhase, listPhases } from "@/lib/roadmap/firestore";
import { handleRouteError, readJsonBody } from "@/lib/roadmap/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/phases — list all phases ordered by orderIndex. */
export async function GET() {
  try {
    return NextResponse.json({ phases: await listPhases() });
  } catch (err) {
    return handleRouteError(err);
  }
}

/** POST /api/phases — create a phase. */
export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const phase = await createPhase({
      phaseNumber: body.phaseNumber,
      name: body.name,
      goal: body.goal,
      description: body.description,
      orderIndex: body.orderIndex as number | undefined,
      isOptional: body.isOptional,
    });
    return NextResponse.json({ phase }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
