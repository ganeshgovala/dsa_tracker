import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type CollectionReference,
  type DocumentData,
  type Firestore,
  type QueryFieldFilterConstraint,
} from "firebase/firestore";
import { getDb, isFirebaseConfigured } from "../firebase";
import { PHASE_SEED } from "./seed-data";
import type {
  Phase,
  PhaseWithTopics,
  ProblemFilters,
  RoadmapDifficulty,
  RoadmapProblem,
  RoadmapTopic,
} from "./types";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
  normalizeDifficulty,
  optionalBoolean,
  optionalString,
  optionalUrl,
  requireInt,
  requireString,
  slugify,
} from "./validation";

/**
 * Data access for the phase-wise roadmap (Phase → Topic → Problem).
 *
 * Collections:
 *   roadmap_phases/{id}
 *   roadmap_topics/{id}
 *   roadmap_problems/{id}
 *
 * Uniqueness & integrity are enforced with deterministic document ids:
 *   phase   → `phase-{phaseNumber}`        (unique phase numbers)
 *   topic   → `{phaseId}--{slug(name)}`    (no duplicate topic per phase)
 *   problem → `{topicId}--{slug(name)}`    (no duplicate problem per topic)
 *
 * This also makes seeding idempotent: re-running a seed with the same data
 * overwrites instead of duplicating. Cascading deletes are handled in code
 * (Firestore has no FK cascade): deleting a phase removes its topics and
 * their problems.
 *
 * Timestamps are ISO-8601 strings so documents serialize cleanly through the
 * JSON API routes.
 */

const PHASES = "roadmap_phases";
const TOPICS = "roadmap_topics";
const PROBLEMS = "roadmap_problems";

const nowIso = () => new Date().toISOString();

function requireDb(): Firestore {
  const db = getDb();
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firebase is not configured. Set the env vars in .env.local.");
  }
  return db;
}

export const phaseDocId = (phaseNumber: number) => `phase-${phaseNumber}`;
export const topicDocId = (phaseId: string, name: string) =>
  `${phaseId}--${slugify(name)}`;
export const problemDocId = (topicId: string, name: string) =>
  `${topicId}--${slugify(name)}`;

// ---------------------------------------------------------------------------
// Phases
// ---------------------------------------------------------------------------

export interface CreatePhaseInput {
  phaseNumber: unknown;
  name: unknown;
  goal: unknown;
  description?: unknown;
  orderIndex?: unknown;
  isOptional?: unknown;
}

export async function createPhase(input: CreatePhaseInput): Promise<Phase> {
  const db = requireDb();
  const phaseNumber = requireInt(input.phaseNumber, "phaseNumber");
  const name = requireString(input.name, "name");
  const goal = requireString(input.goal, "goal", 2000);
  const description = optionalString(input.description, "description");
  const orderIndex =
    input.orderIndex === undefined || input.orderIndex === null
      ? phaseNumber
      : requireInt(input.orderIndex, "orderIndex");
  const isOptional = optionalBoolean(input.isOptional, "isOptional", false);

  const id = phaseDocId(phaseNumber);
  const ref = doc(db, PHASES, id);
  if ((await getDoc(ref)).exists()) {
    throw new ConflictError(`Phase number ${phaseNumber} already exists`);
  }

  const timestamp = nowIso();
  const phase: Phase = {
    id,
    phaseNumber,
    name,
    goal,
    description,
    orderIndex,
    isOptional,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await setDoc(ref, phase);
  return phase;
}

/** Lists phases ordered by `orderIndex`. Falls back to bundled seed phases when Firebase is not configured. */
export async function listPhases(): Promise<Phase[]> {
  if (!isFirebaseConfigured || !getDb()) return seedPhasesAsDocs();
  const db = requireDb();
  try {
    const snap = await getDocs(
      query(collection(db, PHASES), orderBy("orderIndex")),
    );
    if (snap.empty) return [];
    return snap.docs.map((d) => ({ ...(d.data() as Phase), id: d.id }));
  } catch (err) {
    console.warn("[roadmap] falling back to seed phases:", err);
    return seedPhasesAsDocs();
  }
}

function seedPhasesAsDocs(): Phase[] {
  return PHASE_SEED.map((p, i) => ({
    id: phaseDocId(p.phaseNumber),
    phaseNumber: p.phaseNumber,
    name: p.name,
    goal: p.goal,
    description: null,
    orderIndex: i + 1,
    isOptional: p.isOptional,
    createdAt: "",
    updatedAt: "",
  }));
}

export async function getPhase(phaseId: string): Promise<Phase | null> {
  const db = requireDb();
  const snap = await getDoc(doc(db, PHASES, phaseId));
  return snap.exists() ? ({ ...snap.data(), id: snap.id } as Phase) : null;
}

const PHASE_PATCH_FIELDS = [
  "name",
  "goal",
  "description",
  "orderIndex",
  "isOptional",
] as const;

export async function updatePhase(
  phaseId: string,
  patch: Record<string, unknown>,
): Promise<Phase> {
  const db = requireDb();
  const existing = await getPhase(phaseId);
  if (!existing) throw new NotFoundError(`Phase "${phaseId}" not found`);

  const update: Record<string, unknown> = { updatedAt: nowIso() };
  for (const field of PHASE_PATCH_FIELDS) {
    if (!(field in patch)) continue;
    switch (field) {
      case "name":
        update.name = requireString(patch.name, "name");
        break;
      case "goal":
        update.goal = requireString(patch.goal, "goal", 2000);
        break;
      case "description":
        update.description = optionalString(patch.description, "description");
        break;
      case "orderIndex":
        update.orderIndex = requireInt(patch.orderIndex, "orderIndex");
        break;
      case "isOptional":
        update.isOptional = optionalBoolean(patch.isOptional, "isOptional", existing.isOptional);
        break;
    }
  }
  await updateDoc(doc(db, PHASES, phaseId), update);
  return (await getPhase(phaseId)) as Phase;
}

/** Deletes a phase and cascades to its topics and their problems. */
export async function deletePhase(phaseId: string): Promise<void> {
  const db = requireDb();
  const existing = await getPhase(phaseId);
  if (!existing) throw new NotFoundError(`Phase "${phaseId}" not found`);
  await cascadeDelete(db, TOPICS, where("phaseId", "==", phaseId));
  await deleteDoc(doc(db, PHASES, phaseId));
}

async function cascadeDelete(
  db: Firestore,
  collectionName: string,
  constraint: ReturnType<typeof where>,
): Promise<void> {
  const snap = await getDocs(query(collection(db, collectionName), constraint));
  if (snap.empty) return;
  let batch = writeBatch(db);
  let ops = 0;
  for (const d of snap.docs) {
    batch.delete(d.ref);
    if (++ops === 450) {
      await batch.commit();
      batch = writeBatch(db);
      ops = 0;
    }
  }
  await batch.commit();
}

/**
 * Returns a phase with its topics ordered by `orderIndex`. With
 * `includeProblems`, each topic also embeds its ordered problems.
 */
export async function getPhaseWithTopics(
  phaseId: string,
  includeProblems = false,
): Promise<PhaseWithTopics | null> {
  const phase = await getPhase(phaseId);
  if (!phase) return null;

  const topics = await listTopicsByPhaseRef(phaseId);
  const result: PhaseWithTopics = {
    ...phase,
    topics: topics.map((t) => ({ ...t, problems: [] as RoadmapProblem[] })),
  };

  if (includeProblems) {
    const problems = await listProblems({ phaseId });
    const byTopic = new Map<string, RoadmapProblem[]>();
    for (const p of problems) {
      const list = byTopic.get(p.topicId) ?? [];
      list.push(p);
      byTopic.set(p.topicId, list);
    }
    for (const topic of result.topics) {
      topic.problems = byTopic.get(topic.id) ?? [];
    }
  }
  return result;
}

async function listTopicsByPhaseRef(phaseId: string): Promise<RoadmapTopic[]> {
  const db = requireDb();
  // Equality filter only (no orderBy) so Firestore doesn't require a composite
  // (phaseId, orderIndex) index — a phase has few topics, so we sort in memory.
  const snap = await getDocs(
    query(collection(db, TOPICS), where("phaseId", "==", phaseId)),
  );
  return snap.docs
    .map((d) => ({ ...(d.data() as RoadmapTopic), id: d.id }))
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

// ---------------------------------------------------------------------------
// Topics
// ---------------------------------------------------------------------------

export interface CreateTopicInput {
  phaseId: unknown;
  name: unknown;
  description?: unknown;
  orderIndex?: unknown;
}

export async function createTopic(input: CreateTopicInput): Promise<RoadmapTopic> {
  const db = requireDb();
  const phaseId = requireString(input.phaseId, "phaseId");
  const name = requireString(input.name, "name");
  const description = optionalString(input.description, "description");

  const parent = await getPhase(phaseId);
  if (!parent) throw new ValidationError(`Phase "${phaseId}" does not exist`);

  const id = topicDocId(phaseId, name);
  const ref = doc(db, TOPICS, id);
  if ((await getDoc(ref)).exists()) {
    throw new ConflictError(`Topic "${name}" already exists in phase ${phaseId}`);
  }

  // Default order: append after the phase's current last topic.
  let orderIndex: number;
  if (input.orderIndex === undefined || input.orderIndex === null) {
    const siblings = await listTopicsByPhaseRef(phaseId);
    orderIndex = siblings.length
      ? Math.max(...siblings.map((t) => t.orderIndex)) + 1
      : 1;
  } else {
    orderIndex = requireInt(input.orderIndex, "orderIndex");
  }

  const timestamp = nowIso();
  const topic: RoadmapTopic = {
    id,
    phaseId,
    name,
    description,
    orderIndex,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await setDoc(ref, topic);
  return topic;
}

export async function listTopics(phaseId?: string): Promise<RoadmapTopic[]> {
  if (phaseId) return listTopicsByPhaseRef(phaseId);
  const db = requireDb();
  // No orderBy → no composite index required; sort in memory.
  const snap = await getDocs(collection(db, TOPICS));
  return snap.docs
    .map((d) => ({ ...(d.data() as RoadmapTopic), id: d.id }))
    .sort(
      (a, b) => a.phaseId.localeCompare(b.phaseId) || a.orderIndex - b.orderIndex,
    );
}

export async function getTopic(topicId: string): Promise<RoadmapTopic | null> {
  const db = requireDb();
  const snap = await getDoc(doc(db, TOPICS, topicId));
  return snap.exists() ? ({ ...snap.data(), id: snap.id } as RoadmapTopic) : null;
}

const TOPIC_PATCH_FIELDS = ["name", "description", "orderIndex"] as const;

export async function updateTopic(
  topicId: string,
  patch: Record<string, unknown>,
): Promise<RoadmapTopic> {
  const db = requireDb();
  const existing = await getTopic(topicId);
  if (!existing) throw new NotFoundError(`Topic "${topicId}" not found`);

  const update: Record<string, unknown> = { updatedAt: nowIso() };
  for (const field of TOPIC_PATCH_FIELDS) {
    if (!(field in patch)) continue;
    if (field === "name") update.name = requireString(patch.name, "name");
    else if (field === "description")
      update.description = optionalString(patch.description, "description");
    else if (field === "orderIndex")
      update.orderIndex = requireInt(patch.orderIndex, "orderIndex");
  }
  await updateDoc(doc(db, TOPICS, topicId), update);
  return (await getTopic(topicId)) as RoadmapTopic;
}

/** Deletes a topic and cascades to its problems. */
export async function deleteTopic(topicId: string): Promise<void> {
  const db = requireDb();
  const existing = await getTopic(topicId);
  if (!existing) throw new NotFoundError(`Topic "${topicId}" not found`);
  await cascadeDelete(db, PROBLEMS, where("topicId", "==", topicId));
  await deleteDoc(doc(db, TOPICS, topicId));
}

// ---------------------------------------------------------------------------
// Problems
// ---------------------------------------------------------------------------

export interface CreateProblemInput {
  phaseId: unknown;
  topicId: unknown;
  name: unknown;
  difficulty: unknown;
  leetcodeUrl?: unknown;
  gfgUrl?: unknown;
  videoUrl?: unknown;
  orderIndex?: unknown;
  isCore?: unknown;
}

export async function createProblem(
  input: CreateProblemInput,
): Promise<RoadmapProblem> {
  const db = requireDb();
  const phaseId = requireString(input.phaseId, "phaseId");
  const topicId = requireString(input.topicId, "topicId");
  const name = requireString(input.name, "name");
  const difficulty = normalizeDifficulty(input.difficulty);

  const topic = await getTopic(topicId);
  if (!topic) throw new ValidationError(`Topic "${topicId}" does not exist`);
  if (topic.phaseId !== phaseId) {
    throw new ValidationError(
      `Topic "${topicId}" belongs to phase "${topic.phaseId}", not "${phaseId}"`,
    );
  }

  const problem: Omit<RoadmapProblem, "createdAt" | "updatedAt" | "orderIndex"> = {
    id: problemDocId(topicId, name),
    phaseId,
    topicId,
    name,
    difficulty,
    leetcodeUrl: optionalUrl(input.leetcodeUrl, "leetcodeUrl"),
    gfgUrl: optionalUrl(input.gfgUrl, "gfgUrl"),
    videoUrl: optionalUrl(input.videoUrl, "videoUrl"),
    isCore: optionalBoolean(input.isCore, "isCore", true),
  };

  const ref = doc(db, PROBLEMS, problem.id);
  if ((await getDoc(ref)).exists()) {
    throw new ConflictError(`Problem "${name}" already exists in topic ${topicId}`);
  }

  let orderIndex: number;
  if (input.orderIndex === undefined || input.orderIndex === null) {
    const siblings = await listProblems({ topicId });
    orderIndex = siblings.length
      ? Math.max(...siblings.map((p) => p.orderIndex)) + 1
      : 1;
  } else {
    orderIndex = requireInt(input.orderIndex, "orderIndex");
  }

  const timestamp = nowIso();
  const full: RoadmapProblem = { ...problem, orderIndex, createdAt: timestamp, updatedAt: timestamp };
  await setDoc(ref, full);
  return full;
}

export async function getProblem(problemId: string): Promise<RoadmapProblem | null> {
  const db = requireDb();
  const snap = await getDoc(doc(db, PROBLEMS, problemId));
  return snap.exists()
    ? ({ ...snap.data(), id: snap.id } as RoadmapProblem)
    : null;
}

/** Lists problems, optionally filtered by phase, topic and/or difficulty. */
export async function listProblems(
  filters: ProblemFilters = {},
): Promise<RoadmapProblem[]> {
  const db = requireDb();
  const constraints: QueryFieldFilterConstraint[] = [];
  if (filters.topicId) constraints.push(where("topicId", "==", filters.topicId));
  if (filters.phaseId) constraints.push(where("phaseId", "==", filters.phaseId));
  if (filters.difficulty)
    constraints.push(where("difficulty", "==", filters.difficulty));

  const col: CollectionReference<DocumentData> = collection(db, PROBLEMS);
  // Equality filters only (no orderBy) to avoid composite-index requirements;
  // sort in memory since a phase/topic holds a small number of problems.
  const snap = constraints.length
    ? await getDocs(query(col, ...constraints))
    : await getDocs(col);
  return snap.docs
    .map((d) => ({ ...(d.data() as RoadmapProblem), id: d.id }))
    .sort(
      (a, b) =>
        a.phaseId.localeCompare(b.phaseId) ||
        a.topicId.localeCompare(b.topicId) ||
        a.orderIndex - b.orderIndex,
    );
}

const PROBLEM_PATCH_FIELDS = [
  "name",
  "difficulty",
  "leetcodeUrl",
  "gfgUrl",
  "videoUrl",
  "orderIndex",
  "isCore",
] as const;

export async function updateProblem(
  problemId: string,
  patch: Record<string, unknown>,
): Promise<RoadmapProblem> {
  const db = requireDb();
  const existing = await getProblem(problemId);
  if (!existing) throw new NotFoundError(`Problem "${problemId}" not found`);

  const update: Record<string, unknown> = { updatedAt: nowIso() };
  for (const field of PROBLEM_PATCH_FIELDS) {
    if (!(field in patch)) continue;
    switch (field) {
      case "name":
        update.name = requireString(patch.name, "name");
        break;
      case "difficulty":
        update.difficulty = normalizeDifficulty(patch.difficulty);
        break;
      case "leetcodeUrl":
        update.leetcodeUrl = optionalUrl(patch.leetcodeUrl, "leetcodeUrl");
        break;
      case "gfgUrl":
        update.gfgUrl = optionalUrl(patch.gfgUrl, "gfgUrl");
        break;
      case "videoUrl":
        update.videoUrl = optionalUrl(patch.videoUrl, "videoUrl");
        break;
      case "orderIndex":
        update.orderIndex = requireInt(patch.orderIndex, "orderIndex");
        break;
      case "isCore":
        update.isCore = optionalBoolean(patch.isCore, "isCore", existing.isCore);
        break;
    }
  }
  await updateDoc(doc(db, PROBLEMS, problemId), update);
  return (await getProblem(problemId)) as RoadmapProblem;
}

export async function deleteProblem(problemId: string): Promise<void> {
  const db = requireDb();
  const existing = await getProblem(problemId);
  if (!existing) throw new NotFoundError(`Problem "${problemId}" not found`);
  await deleteDoc(doc(db, PROBLEMS, problemId));
}

export type { RoadmapDifficulty };
