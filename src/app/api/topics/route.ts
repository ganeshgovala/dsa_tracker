import { NextResponse } from "next/server";
import { createTopic, listTopics } from "@/lib/roadmap/firestore";
import { handleRouteError, readJsonBody } from "@/lib/roadmap/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/topics?phaseId=... — list topics, optionally scoped to a phase. */
export async function GET(request: Request) {
  try {
    const phaseId =
      new URL(request.url).searchParams.get("phaseId") ?? undefined;
    return NextResponse.json({ topics: await listTopics(phaseId) });
  } catch (err) {
    return handleRouteError(err);
  }
}

/** POST /api/topics — create a topic inside an existing phase. */
export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const topic = await createTopic({
      phaseId: body.phaseId,
      name: body.name,
      description: body.description,
      orderIndex: body.orderIndex as number | undefined,
    });
    return NextResponse.json({ topic }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
