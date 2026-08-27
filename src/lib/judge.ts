export type LangId = "python" | "javascript" | "cpp" | "java";

export interface LanguageConfig {
  id: LangId;
  label: string;
  /** Monaco language id. */
  monaco: string;
  /** Wandbox `language` field, used to resolve a compiler. */
  wandbox: string;
}

export const LANGUAGES: LanguageConfig[] = [
  { id: "python", label: "Python 3", monaco: "python", wandbox: "Python" },
  { id: "javascript", label: "JavaScript", monaco: "javascript", wandbox: "JavaScript" },
  { id: "cpp", label: "C++", monaco: "cpp", wandbox: "C++" },
  { id: "java", label: "Java", monaco: "java", wandbox: "Java" },
];

export function languageById(id: LangId): LanguageConfig {
  return LANGUAGES.find((l) => l.id === id) ?? LANGUAGES[0];
}

/** Normalized result returned by the /api/run route. */
export interface RunResult {
  stdout: string;
  stderr: string;
  /** Compiler output, when a compile step ran (C++/Java). */
  compileOutput: string;
  /** Process exit code (null if it was killed). */
  code: number | null;
  /** Present only when the request itself failed. */
  error?: string;
}

export async function runCode(
  language: LangId,
  code: string,
  stdin: string,
): Promise<RunResult> {
  try {
    const res = await fetch("/api/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ language, code, stdin }),
    });
    const data = (await res.json()) as RunResult;
    if (!res.ok) {
      return {
        stdout: "",
        stderr: "",
        compileOutput: "",
        code: null,
        error: data.error ?? `Runner failed (${res.status})`,
      };
    }
    return data;
  } catch {
    return {
      stdout: "",
      stderr: "",
      compileOutput: "",
      code: null,
      error: "Could not reach the code runner. Check your connection.",
    };
  }
}

/** A program is judged by comparing its trimmed stdout to the expected output. */
export function normalizeOutput(s: string): string {
  return s
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+$/g, ""))
    .join("\n")
    .replace(/\n+$/g, "");
}

export function outputsMatch(actual: string, expected: string): boolean {
  return normalizeOutput(actual) === normalizeOutput(expected);
}
