"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { getFirebaseAuth, googleProvider, isFirebaseConfigured } from "./firebase";
import { ensureUserProfile } from "./friends";

/** Minimal, serializable view of the signed-in user the UI needs. */
export interface AuthUser {
  uid: string;
  name: string;
  email: string | null;
  photoURL: string | null;
  /** When the account was created (ISO string) — anchors the schedule. */
  joinedAt: string | null;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  /** Whether Firebase is configured — false means "demo mode". */
  configured: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

/** Used when Firebase isn't configured yet, so the app still works locally. */
const DEMO_USER: AuthUser = {
  uid: "demo",
  name: "Guest",
  email: null,
  photoURL: null,
  joinedAt: null,
};

const AuthContext = createContext<AuthState | null>(null);

function toAuthUser(u: User): AuthUser {
  const created = u.metadata.creationTime;
  return {
    uid: u.uid,
    name: u.displayName ?? u.email?.split("@")[0] ?? "Coder",
    email: u.email,
    photoURL: u.photoURL,
    joinedAt: created ? new Date(created).toISOString() : null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // In demo mode there's nothing to wait for, so we're not "loading".
  const [user, setUser] = useState<AuthUser | null>(
    isFirebaseConfigured ? null : DEMO_USER,
  );
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let settled = false;
    let auth;
    try {
      auth = getFirebaseAuth();
    } catch {
      setLoading(false);
      return;
    }
    if (!auth) return; // demo mode

    // Safety net: never trap the user on a spinner if auth stalls.
    const timer = setTimeout(() => {
      if (!settled) setLoading(false);
    }, 4000);

    const unsubscribe = onAuthStateChanged(
      auth,
      (u) => {
        settled = true;
        clearTimeout(timer);
        setUser(u ? toAuthUser(u) : null);
        if (u) void ensureUserProfile(toAuthUser(u));
        setLoading(false);
      },
      () => {
        settled = true;
        clearTimeout(timer);
        setLoading(false);
      },
    );

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      configured: isFirebaseConfigured,
      error,
      signInWithGoogle: async () => {
        const auth = getFirebaseAuth();
        if (!auth) return;
        setError(null);
        try {
          await signInWithPopup(auth, googleProvider);
        } catch (e) {
          const code = (e as { code?: string }).code ?? "";
          if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
            return; // user dismissed — not an error worth showing
          }
          setError("Could not sign in with Google. Please try again.");
        }
      },
      logout: async () => {
        const auth = getFirebaseAuth();
        if (!auth) return;
        await signOut(auth);
      },
    }),
    [user, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
