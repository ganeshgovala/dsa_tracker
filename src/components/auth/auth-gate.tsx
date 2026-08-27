"use client";

import { Braces, Loader2, Flame, ListChecks, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

function SignIn() {
  const { signInWithGoogle, error } = useAuth();

  return (
    <div className="flex min-h-screen w-full bg-background p-2 sm:p-3">
      <div className="grid w-full flex-1 md:grid-cols-2">
        {/* Left — illustration */}
        <div className="relative hidden md:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/login_illustration.png"
            alt="Algo — focus, practice, master your DSA journey"
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute left-8 top-8 flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-[oklch(0.55_0.2_280)] shadow-sm shadow-brand/30">
              <Braces className="size-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[0.95rem] font-semibold tracking-tight text-white">
              Algo
            </span>
          </div>
        </div>

        {/* Right — form, fills its half */}
        <div className="relative flex flex-col justify-center overflow-hidden bg-background px-6 py-12 sm:px-12">
          {/* Ambient violet glow */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 size-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/15 blur-[130px]" />
          </div>

          {/* Brand (mobile only — illustration is hidden below md) */}
          <div className="relative mb-8 flex items-center justify-center gap-2.5 md:hidden">
            <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-[oklch(0.55_0.2_280)] shadow-lg shadow-brand/30">
              <Braces className="size-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              Algo
            </span>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div className="text-center">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Welcome to Algo
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Sign in to continue your DSA journey
              </p>
            </div>

            <button
              type="button"
              onClick={signInWithGoogle}
              className="mt-8 flex h-11 w-full items-center justify-center gap-2.5 rounded-lg bg-white text-sm font-medium text-neutral-800 transition-colors hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <GoogleIcon className="size-5" />
              Continue with Google
            </button>

            {error && (
              <p className="mt-3 text-center text-xs text-danger">{error}</p>
            )}

            <div className="mt-6 flex items-center justify-center gap-5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ListChecks className="size-3.5" /> Problems
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Flame className="size-3.5" /> Streaks
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-3.5" /> Friends
              </span>
            </div>

            <p className="mt-10 text-center text-xs text-muted-foreground">
              <a href="#" className="transition-colors hover:text-foreground">
                Terms and Conditions
              </a>
              <span className="mx-1.5">·</span>
              <a href="#" className="transition-colors hover:text-foreground">
                Privacy policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FullScreenLoader() {
  return (
    <div className="grid min-h-screen w-full place-items-center bg-background">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading, configured, user } = useAuth();

  if (loading) return <FullScreenLoader />;
  if (configured && !user) return <SignIn />;
  return <>{children}</>;
}
