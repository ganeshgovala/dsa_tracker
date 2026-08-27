"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { getDb, isFirebaseConfigured } from "./firebase";
import { useAuth } from "./auth-context";

/**
 * User problem progress — the first slice of the user-progress system.
 *
 * Firestore layout (signed-in, configured):
 *   user_progress/{uid}/problems/{problemId} = { solved: boolean, solvedAt: string }
 *
 * Demo mode (not configured): falls back to localStorage keyed by uid so the
 * UI still works locally. Toggles are optimistic for instant feedback.
 *
 * State is a Map of problemId → solvedAt (ISO), so consumers get both the set
 * of solved ids AND the solve dates (needed for the practice-streak calendar).
 */

const LS_PREFIX = "dsa-progress-";

const EMPTY_MAP: Map<string, string> = new Map();

/** Parse stored progress, tolerating the old `["id", ...]` (no-date) format. */
function parseStored(raw: string | null): Map<string, string> {
  const map = new Map<string, string>();
  if (!raw) return map;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (typeof item === "string") map.set(item, "");
        else if (Array.isArray(item) && typeof item[0] === "string") {
          map.set(item[0], typeof item[1] === "string" ? item[1] : "");
        }
      }
    }
  } catch {
    // ignore malformed storage
  }
  return map;
}

export function useProblemProgress() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [stored, setStored] = useState<Map<string, string>>(() => new Map());

  // Reset when the signed-in account changes (render-time state reset).
  const [prevUid, setPrevUid] = useState(uid);
  if (prevUid !== uid) {
    setPrevUid(uid);
    setStored(new Map());
  }

  useEffect(() => {
    if (!uid) return;

    if (isFirebaseConfigured) {
      const db = getDb();
      if (db) {
        const unsubscribe = onSnapshot(
          collection(db, "user_progress", uid, "problems"),
          (snap) => {
            const next = new Map<string, string>();
            snap.docs.forEach((d) => {
              const data = d.data() as { solved?: boolean; solvedAt?: string };
              if (data.solved) next.set(d.id, data.solvedAt ?? "");
            });
            setStored(next);
          },
          (err) => console.warn("[progress] read failed:", err),
        );
        return () => unsubscribe();
      }
    }

    // localStorage fallback (demo mode)
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      try {
        setStored(parseStored(localStorage.getItem(LS_PREFIX + uid)));
      } catch {
        setStored(new Map());
      }
    });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const solvedAt = uid ? stored : EMPTY_MAP;
  const solvedIds = useMemo(() => new Set(solvedAt.keys()), [solvedAt]);

  const toggle = useCallback(
    (problemId: string) => {
      if (!uid) return;
      const isSolved = !stored.has(problemId);
      const now = new Date().toISOString();

      // Optimistic update
      setStored((prev) => {
        const next = new Map(prev);
        if (isSolved) next.set(problemId, now);
        else next.delete(problemId);
        return next;
      });

      if (isFirebaseConfigured) {
        const db = getDb();
        if (db) {
          setDoc(doc(db, "user_progress", uid, "problems", problemId), {
            solved: isSolved,
            solvedAt: now,
          }).catch((err) => console.warn("[progress] write failed:", err));
          return;
        }
      }

      // localStorage fallback
      try {
        const map = parseStored(localStorage.getItem(LS_PREFIX + uid));
        if (isSolved) map.set(problemId, now);
        else map.delete(problemId);
        localStorage.setItem(LS_PREFIX + uid, JSON.stringify([...map.entries()]));
      } catch {
        // ignore storage errors
      }
    },
    [uid, stored],
  );

  return useMemo(
    () => ({ solvedIds, solvedAt, toggle }),
    [solvedIds, solvedAt, toggle],
  );
}
