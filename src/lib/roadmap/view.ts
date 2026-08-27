import { getDb, isFirebaseConfigured } from "../firebase";
import {
  getPhaseWithTopics,
  listPhases,
  phaseDocId,
  problemDocId,
  topicDocId,
} from "./firestore";
import type { ImportedPhase } from "./import-types";
import { BUNDLED_PAYLOADS } from "./data";
import { PHASE_SEED } from "./seed-data";
import type {
  Phase,
  PhaseWithTopics,
  RoadmapDifficulty,
  RoadmapProblem,
  RoadmapTopic,
} from "./types";

/**
 * UI-facing roadmap loader.
 *
 * Reads phases (with topics + problems) from Firestore and degrades
 * gracefully: when Firebase isn't configured — or a read fails — it falls
 * back to the bundled seed data (8 phases + the imported Phase 1 content),
 * mirroring the dashboard's sample-data behavior.
 */
export async function getRoadmapView(): Promise<PhaseWithTopics[]> {
  if (!isFirebaseConfigured || !getDb()) return bundledRoadmap();
  try {
    const phases = await listPhases();
    const detailed = await Promise.all(
      phases.map(async (phase) => {
        try {
          return await getPhaseDetail(phase.id);
        } catch (err) {
          console.warn(`[roadmap] falling back for phase "${phase.id}":`, err);
          return bundledPhase(phase);
        }
      }),
    );
    return detailed;
  } catch (err) {
    console.warn("[roadmap] falling back to bundled roadmap:", err);
    return bundledRoadmap();
  }
}

async function getPhaseDetail(phaseId: string): Promise<PhaseWithTopics> {
  const detail = await getPhaseWithTopics(phaseId, true);
  if (!detail) throw new Error(`Phase "${phaseId}" not found`);
  return detail;
}

function emptyTopics(phase: Phase): PhaseWithTopics {
  return { ...phase, topics: [] };
}

/** Bundled fallback: seed phases + imported Phase 1 topics/problems. */
function bundledRoadmap(): PhaseWithTopics[] {
  const base = new Map<string, PhaseWithTopics>();
  PHASE_SEED.forEach((p, i) => {
    const phase: Phase = {
      id: phaseDocId(p.phaseNumber),
      phaseNumber: p.phaseNumber,
      name: p.name,
      goal: p.goal,
      description: null,
      orderIndex: i + 1,
      isOptional: p.isOptional,
      createdAt: "",
      updatedAt: "",
    };
    base.set(phase.id, { ...phase, topics: [] });
  });

  for (const imported of BUNDLED_PAYLOADS) {
    const phaseId = phaseDocId(imported.phase.number);
    const target = base.get(phaseId);
    if (!target) continue;
    // Later payloads may add more topics to the same phase — append them.
    target.topics.push(
      ...imported.topics.map((t) =>
        bundledTopic(phaseId, t.name, t.order ?? 0, t.problems ?? []),
      ),
    );
  }
  return [...base.values()].map((p) => ({
    ...p,
    topics: [...p.topics].sort((a, b) => a.orderIndex - b.orderIndex),
  }));
}

function bundledPhase(phase: Phase): PhaseWithTopics {
  const fallback = bundledRoadmap().find((p) => p.id === phase.id);
  return fallback ?? emptyTopics(phase);
}

function bundledTopic(
  phaseId: string,
  name: string,
  orderIndex: number,
  problems: ImportedPhase["topics"][number]["problems"],
): RoadmapTopic & { problems: RoadmapProblem[] } {
  const topicId = topicDocId(phaseId, name);
  return {
    id: topicId,
    phaseId,
    name,
    description: null,
    orderIndex,
    createdAt: "",
    updatedAt: "",
    problems: problems.map((p) => ({
      id: problemDocId(topicId, p.name),
      phaseId,
      topicId,
      name: p.name,
      difficulty: normalize(p.difficulty),
      leetcodeUrl: p.leetcode_url ?? null,
      gfgUrl: p.gfg_url ?? null,
      videoUrl: p.video_url ?? null,
      orderIndex: p.order ?? 0,
      isCore: p.is_core ?? true,
      createdAt: "",
      updatedAt: "",
    })),
  };
}

function normalize(value: string): RoadmapDifficulty {
  const upper = value.trim().toUpperCase();
  return upper === "MEDIUM" || upper === "HARD"
    ? (upper as RoadmapDifficulty)
    : "EASY";
}
