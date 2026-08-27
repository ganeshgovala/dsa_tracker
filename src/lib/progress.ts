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
 */

const LS_PREFIX = "dsa-progress-";

const EMPTY_SET: Set<string> = new Set();

export function useProblemProgress() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [stored, setStored] = useState<Set<string>>(() => new Set());

  // Reset when the signed-in account changes (render-time state reset).
  const [prevUid, setPrevUid] = useState(uid);
  if (prevUid !== uid) {
    setPrevUid(uid);
    setStored(new Set());
  }

  useEffect(() => {
    if (!uid) return;

    if (isFirebaseConfigured) {
      const db = getDb();
      if (db) {
        const unsubscribe = onSnapshot(
          collection(db, "user_progress", uid, "problems"),
          (snap) => {
            const next = new Set<string>();
            snap.docs.forEach((d) => {
              if ((d.data() as { solved?: boolean }).solved) next.add(d.id);
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
        const raw = localStorage.getItem(LS_PREFIX + uid);
        setStored(new Set(JSON.parse(raw ?? "[]") as string[]));
      } catch {
        setStored(new Set());
      }
    });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const solvedIds = uid ? stored : EMPTY_SET;

  const toggle = useCallback(
    (problemId: string) => {
      if (!uid) return;
      const isSolved = !solvedIds.has(problemId);

      // Optimistic update
      setStored((prev) => {
        const next = new Set(uid ? prev : EMPTY_SET);
        if (isSolved) next.add(problemId);
        else next.delete(problemId);
        return next;
      });

      if (isFirebaseConfigured) {
        const db = getDb();
        if (db) {
          setDoc(
            doc(db, "user_progress", uid, "problems", problemId),
            { solved: isSolved, solvedAt: new Date().toISOString() },
          ).catch((err) =>
            console.warn("[progress] write failed:", err),
          );
          return;
        }
      }
      // localStorage fallback
      try {
        const raw = localStorage.getItem(LS_PREFIX + uid);
        const list = new Set(JSON.parse(raw ?? "[]") as string[]);
        if (isSolved) list.add(problemId);
        else list.delete(problemId);
        localStorage.setItem(
          LS_PREFIX + uid,
          JSON.stringify([...list]),
        );
      } catch {
        // ignore storage errors
      }
    },
    [uid, solvedIds],
  );

  return useMemo(() => ({ solvedIds, toggle }), [solvedIds, toggle]);
}
