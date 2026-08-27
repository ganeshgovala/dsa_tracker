import { NextResponse } from "next/server";
import { createProblem, listProblems } from "@/lib/roadmap/firestore";
import { handleRouteError, readJsonBody } from "@/lib/roadmap/http";
import type { RoadmapDifficulty } from "@/lib/roadmap/types";
import { normalizeDifficulty } from "@/lib/roadmap/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/problems — list problems with optional filters:
 *   ?phaseId=...&topicId=...&difficulty=EASY|MEDIUM|HARD
 */
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const difficultyParam = params.get("difficulty");
    const problems = await listProblems({
      phaseId: params.get("phaseId") ?? undefined,
      topicId: params.get("topicId") ?? undefined,
      difficulty: difficultyParam
        ? normalizeDifficulty(difficultyParam)
        : undefined,
    });
    return NextResponse.json({ count: problems.length, problems });
  } catch (err) {
    return handleRouteError(err);
  }
}

/** POST /api/problems — create a problem under a phase + topic. */
export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const problem = await createProblem({
      phaseId: body.phaseId,
      topicId: body.topicId,
      name: body.name ?? body.problemName,
      difficulty: body.difficulty as RoadmapDifficulty | undefined,
      leetcodeUrl: body.leetcodeUrl,
      gfgUrl: body.gfgUrl,
      videoUrl: body.videoUrl,
      orderIndex: body.orderIndex as number | undefined,
      isCore: body.isCore,
    });
    return NextResponse.json({ problem }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
