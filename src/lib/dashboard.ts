import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { getDb, isFirebaseConfigured } from "./firebase";
import type { DashboardData, Friend, Problem, Stats, Topic } from "./types";

/**
 * Data access for the dashboard.
 *
 * Reads live data from Firestore only — there are no bundled samples. When
 * Firebase isn't configured, a read fails, or nothing has been recorded yet,
 * getters return empty defaults and the UI renders its empty states.
 *
 * Expected Firestore layout:
 *   stats/summary                (single doc matching `Stats`)
 *   problems/{id}                (docs matching `Problem`)
 *   topics/{id}                  (docs matching `Topic`)
 *   friends/{id}                 (docs matching `Friend`)
 */

/** All-zero stats used before the user has any recorded activity. */
export const EMPTY_STATS: Stats = {
  problemsSolved: 0,
  solvedDeltaPct: 0,
  weeklySolved: [0, 0, 0, 0, 0, 0, 0],
  topicsCovered: 0,
  topicsTotal: 0,
  solvedByDifficulty: { easy: 0, medium: 0, hard: 0 },
  streakDays: 0,
  bestStreak: 0,
  totalCheckIns: 0,
  contributions: Array.from({ length: 35 }, () => 0),
};

async function readCollection<T>(name: string): Promise<T[]> {
  const db = getDb();
  if (!isFirebaseConfigured || !db) return [];
  try {
    const snap = await getDocs(collection(db, name));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
  } catch (err) {
    console.warn(`[dashboard] could not read "${name}":`, err);
    return [];
  }
}

export async function getStats(): Promise<Stats> {
  const db = getDb();
  if (!isFirebaseConfigured || !db) return EMPTY_STATS;
  try {
    const snap = await getDoc(doc(db, "stats", "summary"));
    return snap.exists() ? (snap.data() as Stats) : EMPTY_STATS;
  } catch (err) {
    console.warn("[dashboard] could not read stats:", err);
    return EMPTY_STATS;
  }
}

export const getProblems = () => readCollection<Problem>("problems");
export const getTopics = () => readCollection<Topic>("topics");
export const getFriends = () => readCollection<Friend>("friends");

export async function getDashboardData(): Promise<DashboardData> {
  const [stats, problems, topics, friends] = await Promise.all([
    getStats(),
    getProblems(),
    getTopics(),
    getFriends(),
  ]);
  return { stats, problems, topics, friends };
}
