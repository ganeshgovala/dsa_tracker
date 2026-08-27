import {
  createPhase,
  createProblem,
  createTopic,
  phaseDocId,
  problemDocId,
  topicDocId,
  updatePhase,
  updateProblem,
  updateTopic,
} from "./firestore";
import type { ImportedPhase, ImportResult } from "./import-types";
import { ValidationError } from "./validation";

/**
 * Idempotent importer for a phase payload (phase → topics → problems).
 *
 * - Phase is created if missing (seed-phases normally creates it first) and
 *   its name/isOptional are refreshed from the payload.
 * - Topics are upserted; the payload's `order` becomes `orderIndex`.
 * - Problems are upserted: created on first run, refreshed on re-runs, so the
 *   import can be replayed safely after editing links or orders.
 */
export async function importPhaseData(
  payload: ImportedPhase,
): Promise<ImportResult> {
  const number = payload.phase.number;
  if (typeof number !== "number" || !Number.isInteger(number) || number < 1) {
    throw new ValidationError('"phase.number" must be a positive integer');
  }
  if (!Array.isArray(payload.topics)) {
    throw new ValidationError('"topics" must be an array');
  }

  const phaseId = phaseDocId(number);
  const name = payload.phase.name?.trim();
  const isOptional = payload.phase.is_optional ?? false;

  try {
    await createPhase({
      phaseNumber: number,
      name: name ?? `Phase ${number}`,
      goal: payload.phase.goal ?? "(goal not set)",
      orderIndex: number,
      isOptional,
    });
  } catch (err) {
    if (!(err instanceof ValidationError)) throw err;
    if (name || "is_optional" in payload.phase) {
      await updatePhase(phaseId, {
        ...(name ? { name } : {}),
        isOptional,
      });
    }
  }

  let topicsCreated = 0;
  let topicsUpdated = 0;
  let problemsCreated = 0;
  let problemsUpdated = 0;

  for (const topic of payload.topics) {
    const topicName = requireImportedName(topic.name, "topic.name");
    const topicId = topicDocId(phaseId, topicName);

    try {
      await createTopic({
        phaseId,
        name: topicName,
        orderIndex: topic.order ?? undefined,
      });
      topicsCreated++;
    } catch (err) {
      if (!(err instanceof ValidationError)) throw err;
      await updateTopic(topicId, {
        ...(topic.order != null ? { orderIndex: topic.order } : {}),
      });
      topicsUpdated++;
    }

    for (const problem of topic.problems ?? []) {
      const problemName = requireImportedName(problem.name, "problem.name");
      const fields = {
        name: problemName,
        difficulty: problem.difficulty,
        leetcodeUrl: problem.leetcode_url ?? null,
        gfgUrl: problem.gfg_url ?? null,
        videoUrl: problem.video_url ?? null,
        isCore: problem.is_core ?? true,
      };

      try {
        await createProblem({
          phaseId,
          topicId,
          ...fields,
          orderIndex: problem.order ?? undefined,
        });
        problemsCreated++;
      } catch (err) {
        if (!(err instanceof ValidationError)) throw err;
        await updateProblem(problemDocId(topicId, problemName), {
          ...fields,
          ...(problem.order != null ? { orderIndex: problem.order } : {}),
        });
        problemsUpdated++;
      }
    }
  }

  return {
    phaseId,
    topicsCreated,
    topicsUpdated,
    problemsCreated,
    problemsUpdated,
  };
}

function requireImportedName(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ValidationError(`"${field}" is required`);
  }
  return value.trim();
}
