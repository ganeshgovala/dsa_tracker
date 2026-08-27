import { NextResponse } from "next/server";
import { LANGUAGES, type LangId } from "@/lib/judge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WANDBOX = "https://wandbox.org/api";

interface WandboxCompiler {
  name: string;
  language: string;
}

// Stable compilers to use if the compiler list can't be fetched.
const FALLBACK_COMPILERS: Record<string, string> = {
  Python: "cpython-3.14.0",
  JavaScript: "nodejs-20.17.0",
  "C++": "gcc-13.2.0",
  Java: "openjdk-jdk-22+36",
};

let compilerCache: WandboxCompiler[] | null = null;
let compilerFetchedAt = 0;

async function resolveCompiler(wandboxLang: string): Promise<string> {
  const now = Date.now();
  if (!compilerCache || now - compilerFetchedAt > 60 * 60 * 1000) {
    try {
      const res = await fetch(`${WANDBOX}/list.json`, { cache: "no-store" });
      if (res.ok) {
        compilerCache = (await res.json()) as WandboxCompiler[];
        compilerFetchedAt = now;
      }
    } catch {
      // fall back below
    }
  }
  const forLang = (compilerCache ?? [])
    .filter((c) => c.language === wandboxLang)
    .map((c) => c.name);
  // Prefer a pinned release over the often-broken "*-head" nightly builds.
  const stable = forLang.find((n) => !n.includes("head"));
  return stable ?? forLang[0] ?? FALLBACK_COMPILERS[wandboxLang] ?? "";
}

export async function POST(request: Request) {
  let payload: { language?: LangId; code?: string; stdin?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { language, code, stdin = "" } = payload;
  const config = LANGUAGES.find((l) => l.id === language);
  if (!config) {
    return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
  }
  if (typeof code !== "string" || code.trim() === "") {
    return NextResponse.json({ error: "No code to run" }, { status: 400 });
  }
  if (code.length > 100_000) {
    return NextResponse.json({ error: "Code is too large" }, { status: 413 });
  }

  const compiler = await resolveCompiler(config.wandbox);
  if (!compiler) {
    return NextResponse.json(
      { error: "No compiler available for this language right now." },
      { status: 502 },
    );
  }

  try {
    const res = await fetch(`${WANDBOX}/compile.json`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ compiler, code, stdin, save: false }),
    });

    if (!res.ok) {
      const text = await res.text();
      const msg =
        res.status === 429
          ? "The runner is rate-limited right now. Wait a moment and try again."
          : `Runner error (${res.status}): ${text.slice(0, 200)}`;
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    const data = (await res.json()) as {
      status?: string;
      program_output?: string;
      program_error?: string;
      compiler_error?: string;
      compiler_message?: string;
    };

    const compileOutput = data.compiler_error || "";
    const statusCode =
      data.status !== undefined && data.status !== "" ? Number(data.status) : null;

    return NextResponse.json({
      stdout: data.program_output ?? "",
      stderr: data.program_error ?? "",
      compileOutput,
      code: Number.isNaN(statusCode) ? null : statusCode,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the execution service." },
      { status: 502 },
    );
  }
}
