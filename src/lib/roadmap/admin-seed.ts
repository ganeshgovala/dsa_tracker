import { getAdminDb } from "@/lib/firebase-admin";
import { PHASE_SEED } from "./seed-data";
import type { ImportedPhase, ImportResult } from "./import-types";
import { ValidationError, normalizeDifficulty, slugify } from "./validation";

/**
 * Admin-SDK seeder — mirror of `seed.ts` + `import.ts`, but writes via the
 * Firebase Admin SDK so it BYPASSES security rules. Same collections, same
 * deterministic document ids, same field shapes, so the client-SDK reads
 * (`getRoadmapView` / GET routes) pick the data up unchanged.
 *
 * Idempotent: re-running upserts by deterministic id (createdAt preserved,
 * updatedAt refreshed) instead of duplicating.
 */

const PHASES = "roadmap_phases";
const TOPICS = "roadmap_topics";
const PROBLEMS = "roadmap_problems";

// Deterministic ids — identical to the client layer (see firestore.ts).
const phaseDocId = (phaseNumber: number) => `phase-${phaseNumber}`;
const topicDocId = (phaseId: string, name: string) =>
  `${phaseId}--${slugify(name)}`;
const problemDocId = (topicId: string, name: string) =>
  `${topicId}--${slugify(name)}`;

const nowIso = () => new Date().toISOString();

/**
 * Upsert one document. Preserves `createdAt` on existing docs and always writes
 * `id`/`updatedAt`. Returns whether the doc already existed (for created/updated
 * counting).
 */
async function upsert(
  collection: string,
  id: string,
  data: Record<string, unknown>,
): Promise<boolean> {
  const ref = getAdminDb().collection(collection).doc(id);
  const snap = await ref.get();
  const existed = snap.exists;
  const now = nowIso();
  const createdAt = existed ? (snap.get("createdAt") ?? now) : now;
  await ref.set({ ...data, id, createdAt, updatedAt: now }, { merge: true });
  return existed;
}

function requireName(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ValidationError(`"${field}" is required`);
  }
  return value.trim();
}

/** Idempotently seeds the 8 roadmap phases into `roadmap_phases`. */
export async function adminSeedPhases(): Promise<{
  created: string[];
  updated: string[];
}> {
  const created: string[] = [];
  const updated: string[] = [];

  for (let i = 0; i < PHASE_SEED.length; i++) {
    const seed = PHASE_SEED[i];
    const id = phaseDocId(seed.phaseNumber);
    const existed = await upsert(PHASES, id, {
      phaseNumber: seed.phaseNumber,
      name: seed.name,
      goal: seed.goal,
      description: null,
      orderIndex: i + 1,
      isOptional: seed.isOptional,
    });
    (existed ? updated : created).push(id);
  }

  return { created, updated };
}

/** Idempotently imports one phase payload (phase → topics → problems). */
export async function adminImportPhaseData(
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

  // Ensure the phase exists WITHOUT clobbering an already-seeded phase.
  // On first creation we fill defaults; if it already exists we only refresh
  // the fields the payload actually specifies (name/isOptional) and never
  // overwrite `goal`/`description` (which come from adminSeedPhases).
  const phaseSnap = await getAdminDb().collection(PHASES).doc(phaseId).get();
  if (!phaseSnap.exists) {
    await upsert(PHASES, phaseId, {
      phaseNumber: number,
      name: payload.phase.name?.trim() || `Phase ${number}`,
      goal: payload.phase.goal ?? "(goal not set)",
      description: null,
      orderIndex: number,
      isOptional: payload.phase.is_optional ?? false,
    });
  } else {
    const patch: Record<string, unknown> = {};
    if (payload.phase.name?.trim()) patch.name = payload.phase.name.trim();
    if ("is_optional" in payload.phase) {
      patch.isOptional = payload.phase.is_optional ?? false;
    }
    if (Object.keys(patch).length > 0) await upsert(PHASES, phaseId, patch);
  }

  let topicsCreated = 0;
  let topicsUpdated = 0;
  let problemsCreated = 0;
  let problemsUpdated = 0;

  for (let ti = 0; ti < payload.topics.length; ti++) {
    const topic = payload.topics[ti];
    const topicName = requireName(topic.name, "topic.name");
    const topicId = topicDocId(phaseId, topicName);

    const topicExisted = await upsert(TOPICS, topicId, {
      phaseId,
      name: topicName,
      description: null,
      orderIndex: topic.order ?? ti + 1,
    });
    if (topicExisted) topicsUpdated++;
    else topicsCreated++;

    const problems = topic.problems ?? [];
    for (let pi = 0; pi < problems.length; pi++) {
      const problem = problems[pi];
      const problemName = requireName(problem.name, "problem.name");
      const problemId = problemDocId(topicId, problemName);

      const problemExisted = await upsert(PROBLEMS, problemId, {
        phaseId,
        topicId,
        name: problemName,
        difficulty: normalizeDifficulty(problem.difficulty),
        leetcodeUrl: problem.leetcode_url ?? null,
        gfgUrl: problem.gfg_url ?? null,
        videoUrl: problem.video_url ?? null,
        orderIndex: problem.order ?? pi + 1,
        isCore: problem.is_core ?? true,
      });
      if (problemExisted) problemsUpdated++;
      else problemsCreated++;
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
