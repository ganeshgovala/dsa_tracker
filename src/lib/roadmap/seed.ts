import { getDb, isFirebaseConfigured } from "../firebase";
import { PHASE_SEED } from "./seed-data";
import { createPhase, phaseDocId } from "./firestore";
import { getDoc, doc, setDoc, type Firestore } from "firebase/firestore";
import { ConflictError } from "./validation";

/**
 * Idempotently seeds the 8 roadmap phases into `roadmap_phases`.
 * Safe to run repeatedly: existing phases are updated (goal/name/isOptional)
 * instead of duplicated; nothing else is created.
 */
export async function seedPhases(): Promise<{
  created: string[];
  updated: string[];
}> {
  const db = getDb();
  if (!isFirebaseConfigured || !db) {
    throw new Error(
      "Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* env vars in .env.local first.",
    );
  }

  const created: string[] = [];
  const updated: string[] = [];

  for (let i = 0; i < PHASE_SEED.length; i++) {
    const seed = PHASE_SEED[i];
    const id = phaseDocId(seed.phaseNumber);
    const existed = await docExists(db, "roadmap_phases", id);
    try {
      await createPhase({
        phaseNumber: seed.phaseNumber,
        name: seed.name,
        goal: seed.goal,
        description: null,
        orderIndex: i + 1,
        isOptional: seed.isOptional,
      });
    } catch (err) {
      if (!(err instanceof ConflictError)) throw err;
      // Already seeded: refresh the mutable fields in place.
      await setDoc(
        doc(db, "roadmap_phases", id),
        {
          name: seed.name,
          goal: seed.goal,
          orderIndex: i + 1,
          isOptional: seed.isOptional,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    }
    (existed ? updated : created).push(id);
  }
  return { created, updated };
}

async function docExists(
  db: Firestore,
  collectionName: string,
  id: string,
): Promise<boolean> {
  return (await getDoc(doc(db, collectionName, id))).exists();
}
