"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { getDb, isFirebaseConfigured } from "./firebase";
import { useAuth } from "./auth-context";
import type { AuthUser } from "./auth-context";
import type { Friend } from "./types";

/**
 * Friends system:
 *   users/{uid}                          — public profile directory
 *   user_friends/{uid}/friends/{friendUid} — the user's added friends
 *
 * Demo mode (not configured): everything is empty and writes are no-ops.
 */

export interface UserProfile {
  uid: string;
  name: string;
  email: string | null;
  photoURL: string | null;
}

const HUES = [
  "oklch(0.62 0.19 293)",
  "oklch(0.64 0.16 250)",
  "oklch(0.66 0.15 200)",
  "oklch(0.68 0.15 158)",
  "oklch(0.72 0.15 80)",
  "oklch(0.64 0.2 20)",
  "oklch(0.65 0.18 340)",
];

function hueFor(uid: string) {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) hash = (hash * 31 + uid.charCodeAt(i)) >>> 0;
  return HUES[hash % HUES.length];
}

export function toFriend(profile: UserProfile): Friend {
  const initial = (profile.name || "?").trim().charAt(0).toUpperCase();
  return {
    id: profile.uid,
    name: profile.name,
    initial,
    hue: hueFor(profile.uid),
    photoURL: profile.photoURL,
    streak: 0,
    bestStreak: 0,
    friendSolvedToday: false,
    lastActive: "—",
  };
}

/** Upserts the signed-in user's public profile into the `users` directory. */
export async function ensureUserProfile(user: AuthUser): Promise<void> {
  const db = getDb();
  if (!isFirebaseConfigured || !db) return;
  try {
    await setDoc(
      doc(db, "users", user.uid),
      {
        uid: user.uid,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  } catch (err) {
    console.warn("[friends] could not upsert user profile:", err);
  }
}

/** Live list of the user's added friends. */
export function useUserFriends(): { friends: Friend[]; friendIds: Set<string> } {
  const { user } = useAuthSafe();
  const [friends, setFriends] = useState<Friend[]>([]);

  // Reset when the signed-in account changes (render-time state reset).
  const [prevUser, setPrevUser] = useState(user);
  if (prevUser !== user) {
    setPrevUser(user);
    setFriends([]);
  }

  useEffect(() => {
    if (!user) return;
    const db = isFirebaseConfigured ? getDb() : undefined;
    if (!db) return;
    const unsubscribe = onSnapshot(
      collection(db, "user_friends", user.uid, "friends"),
      (snap) => {
        setFriends(
          snap.docs.map((d) => {
            const data = d.data() as Partial<UserProfile>;
            return toFriend({
              uid: d.id,
              name: data.name ?? "Unknown",
              email: data.email ?? null,
              photoURL: data.photoURL ?? null,
            });
          }),
        );
      },
      (err) => console.warn("[friends] read failed:", err),
    );
    return () => unsubscribe();
  }, [user]);

  const friendIds = useMemo(() => new Set(friends.map((f) => f.id)), [friends]);
  return { friends, friendIds };
}

/** Adds a user as a friend (idempotent). */
export async function addFriend(
  uid: string,
  profile: UserProfile,
): Promise<void> {
  const db = getDb();
  if (!isFirebaseConfigured || !db) return;
  await setDoc(
    doc(db, "user_friends", uid, "friends", profile.uid),
    {
      name: profile.name,
      email: profile.email,
      photoURL: profile.photoURL,
      addedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

// Small helper so the hooks above share one auth accessor.
function useAuthSafe() {
  return useAuth();
}

/** Live list of other users available to add (excludes the current user). */
export function useAvailableUsers(): { users: UserProfile[]; loading: boolean } {
  const { user } = useAuthSafe();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Reset when the signed-in account changes (render-time state reset).
  const [prevUser, setPrevUser] = useState(user);
  if (prevUser !== user) {
    setPrevUser(user);
    setUsers([]);
    setLoading(true);
  }

  useEffect(() => {
    if (!user) return;
    const db = isFirebaseConfigured ? getDb() : undefined;
    if (!db) return;
    const unsubscribe = onSnapshot(
      query(collection(db, "users"), where("uid", "!=", user.uid)),
      (snap) => {
        setUsers(
          snap.docs.map((d) => {
            const data = d.data() as Partial<UserProfile>;
            return {
              uid: d.id,
              name: data.name ?? "Unknown",
              email: data.email ?? null,
              photoURL: data.photoURL ?? null,
            };
          }),
        );
        setLoading(false);
      },
      (err) => {
        console.warn("[friends] directory read failed:", err);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, [user]);

  const active = Boolean(user && isFirebaseConfigured);
  return {
    users: active ? users : [],
    loading: active ? loading : false,
  };
}
