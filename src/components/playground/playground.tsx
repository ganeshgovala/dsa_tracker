"use client";

import { Fragment, useState } from "react";
import {
  Play,
  FlaskConical,
  RotateCcw,
  ChevronDown,
  Check,
  CircleCheck,
  CircleX,
  Loader2,
  Terminal,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DifficultyBadge } from "@/components/dashboard/badges";
import { CodeEditor } from "./code-editor";
import {
  LANGUAGES,
  languageById,
  normalizeOutput,
  outputsMatch,
  runCode,
  type LangId,
  type RunResult,
} from "@/lib/judge";
import {
  assembleSource,
  buildBatchStdin,
  type PlaygroundProblem,
} from "@/lib/playground-problems";

/** Render a string with `backtick` segments as inline code. */
function renderInline(text: string) {
  return text.split("`").map((seg, i) =>
    i % 2 === 1 ? (
      <code
        key={i}
        className="rounded bg-white/[0.08] px-1 py-0.5 font-mono text-[0.85em] text-foreground"
      >
        {seg}
      </code>
    ) : (
      <Fragment key={i}>{seg}</Fragment>
    ),
  );
}

interface TestOutcome {
  index: number;
  passed: boolean;
  input: string;
  expected: string;
  got: string;
  stderr: string;
  compileOutput: string;
  error?: string;
}

type ConsoleState =
  | { kind: "idle" }
  | { kind: "run"; stdin: string; result: RunResult }
  | { kind: "tests"; outcomes: TestOutcome[]; fatal?: string };

export function Playground({ problem }: { problem: PlaygroundProblem }) {
  const [lang, setLang] = useState<LangId>("java");
  const [codeByLang, setCodeByLang] = useState<Record<LangId, string>>(
    () => ({ ...problem.starter }),
  );
  const [stdin, setStdin] = useState(problem.examples[0]?.input ?? "");
  const [running, setRunning] = useState(false);
  const [tab, setTab] = useState<"testcase" | "result">("testcase");
  const [consoleState, setConsoleState] = useState<ConsoleState>({ kind: "idle" });

  const code = codeByLang[lang];

  function updateCode(value: string) {
    setCodeByLang((prev) => ({ ...prev, [lang]: value }));
  }

  function resetCode() {
    setCodeByLang((prev) => ({ ...prev, [lang]: problem.starter[lang] }));
  }

  async function handleRun() {
    setRunning(true);
    setTab("result");
    // Wrap the single custom case as a one-case batch (T = 1).
    const source = assembleSource(problem, lang, code);
    const result = await runCode(lang, source, `1\n${stdin}\n`);
    setConsoleState({ kind: "run", stdin, result });
    setRunning(false);
  }

  async function handleRunTests() {
    setRunning(true);
    setTab("result");
    // Compile once, run every case in a single execution.
    const source = assembleSource(problem, lang, code);
    const r = await runCode(lang, source, buildBatchStdin(problem.tests));

    if (r.error || r.compileOutput) {
      setConsoleState({
        kind: "tests",
        fatal: r.error ?? r.compileOutput,
        outcomes: problem.tests.map((t, i) => ({
          index: i,
          passed: false,
          input: t.input,
          expected: t.expected,
          got: "",
          stderr: r.stderr,
          compileOutput: r.compileOutput,
          error: r.error,
        })),
      });
      setRunning(false);
      return;
    }

    const lines = normalizeOutput(r.stdout).split("\n");
    const outcomes: TestOutcome[] = problem.tests.map((t, i) => {
      const got = lines[i] ?? "";
      return {
        index: i,
        passed: outputsMatch(got, t.expected),
        input: t.input,
        expected: t.expected,
        got,
        stderr: r.stderr,
        compileOutput: "",
      };
    });
    setConsoleState({ kind: "tests", outcomes });
    setRunning(false);
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Problem description */}
      <div className="hidden w-[42%] max-w-[560px] shrink-0 flex-col overflow-y-auto border-r border-border xl:flex">
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {problem.title}
            </h1>
            <DifficultyBadge difficulty={problem.difficulty} />
            <span className="inline-flex h-5 items-center rounded-full border border-border px-2 text-xs text-muted-foreground">
              {problem.topic}
            </span>
          </div>

          <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            {problem.description.map((p, i) => (
              <p key={i}>{renderInline(p)}</p>
            ))}
          </div>

          <div className="mt-4 flex gap-2.5 rounded-xl border border-brand/20 bg-brand/[0.06] p-3 text-sm">
            <Code2 className="mt-0.5 size-4 shrink-0 text-brand" />
            <p className="text-muted-foreground">
              Implement the method below — the runner passes every test case to
              it and checks your return value.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {problem.examples.map((ex, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card/60 p-3.5"
              >
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Example {i + 1}
                </p>
                <div className="space-y-2 text-sm">
                  <ExampleRow label="Input" value={ex.input} />
                  <ExampleRow label="Output" value={ex.output} />
                  {ex.explanation && (
                    <p className="text-xs text-muted-foreground">
                      {renderInline(ex.explanation)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Section title="Constraints">
            <ul className="space-y-1 font-mono text-xs">
              {problem.constraints.map((c, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-muted-foreground/50">•</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>

      {/* Editor + console */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-white/[0.04] px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/[0.06] focus-visible:outline-none">
              <span className="size-1.5 rounded-full bg-brand" />
              {languageById(lang).label}
              <ChevronDown className="size-3.5 opacity-70" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              {LANGUAGES.map((l) => (
                <DropdownMenuItem key={l.id} onClick={() => setLang(l.id)}>
                  {l.label}
                  {l.id === lang && <Check className="ml-auto size-4" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={resetCode}
              disabled={running}
              aria-label="Reset code"
              title="Reset to starter code"
            >
              <RotateCcw />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRun}
              disabled={running}
              className="gap-1.5"
            >
              {running ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Play className="fill-current" />
              )}
              Run
            </Button>
            <Button
              size="sm"
              onClick={handleRunTests}
              disabled={running}
              className="gap-1.5"
            >
              {running ? <Loader2 className="animate-spin" /> : <FlaskConical />}
              Run tests
            </Button>
          </div>
        </div>

        {/* Editor */}
        <div className="min-h-0 flex-1 bg-[#17171c]">
          <CodeEditor
            language={languageById(lang).monaco}
            value={code}
            onChange={updateCode}
          />
        </div>

        {/* Console */}
        <div className="flex h-64 shrink-0 flex-col border-t border-border">
          <div className="flex items-center gap-1 border-b border-border px-2">
            <ConsoleTab
              active={tab === "testcase"}
              onClick={() => setTab("testcase")}
            >
              Testcase
            </ConsoleTab>
            <ConsoleTab
              active={tab === "result"}
              onClick={() => setTab("result")}
            >
              Result
            </ConsoleTab>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {tab === "testcase" ? (
              <div className="flex h-full flex-col gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Custom input (stdin)
                  </label>
                  <div className="flex gap-1">
                    {problem.examples.map((ex, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setStdin(ex.input)}
                        className="rounded-md border border-border px-1.5 py-0.5 text-[0.6875rem] text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                      >
                        Example {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  spellCheck={false}
                  className="min-h-0 flex-1 resize-none rounded-lg border border-border bg-white/[0.03] p-3 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand/40"
                />
              </div>
            ) : (
              <ResultView state={consoleState} running={running} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
        {title}
      </h2>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

function ExampleRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <pre className="mt-1 overflow-x-auto whitespace-pre-wrap rounded-md bg-white/[0.04] px-2.5 py-1.5 font-mono text-xs text-foreground">
        {value}
      </pre>
    </div>
  );
}

function ConsoleTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative h-9 px-3 text-sm font-medium transition-colors",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
      {active && (
        <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-brand" />
      )}
    </button>
  );
}

function ResultView({
  state,
  running,
}: {
  state: ConsoleState;
  running: boolean;
}) {
  if (state.kind === "idle" && !running) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
        <Terminal className="size-5" />
        <p className="text-xs">
          Run your code to see the output, or run the tests to check your
          solution.
        </p>
      </div>
    );
  }

  if (running && state.kind === "idle") {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Running…
      </div>
    );
  }

  if (state.kind === "run") {
    const { result } = state;
    return (
      <div className="space-y-3 text-xs">
        {result.error && <Banner tone="danger">{result.error}</Banner>}
        {result.compileOutput && (
          <OutputBlock label="Compiler" tone="warning" value={result.compileOutput} />
        )}
        <OutputBlock
          label="Output"
          value={result.stdout || "(no output)"}
        />
        {result.stderr && (
          <OutputBlock label="Stderr" tone="danger" value={result.stderr} />
        )}
        {result.code !== null && (
          <p className="text-muted-foreground">Exit code: {result.code}</p>
        )}
      </div>
    );
  }

  if (state.kind !== "tests") return null;

  // tests
  const total = state.outcomes.length;
  const passed = state.outcomes.filter((o) => o.passed).length;
  const allDone = !running;
  const allPassed = allDone && passed === total && total > 0;

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center gap-2">
        {running ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : allPassed ? (
          <CircleCheck className="size-4 text-success" />
        ) : (
          <CircleX className="size-4 text-danger" />
        )}
        <span
          className={cn(
            "text-sm font-medium",
            allPassed ? "text-success" : allDone ? "text-danger" : "text-foreground",
          )}
        >
          {allPassed
            ? "Accepted"
            : running
              ? "Running tests…"
              : state.fatal
                ? "Error"
                : "Wrong answer"}
        </span>
        <span className="text-muted-foreground">
          {passed}/{total} passed
        </span>
      </div>

      {state.fatal ? (
        <Banner tone="danger">{state.fatal}</Banner>
      ) : (
        <div className="space-y-2">
          {state.outcomes.map((o) => (
          <div
            key={o.index}
            className={cn(
              "rounded-lg border p-2.5",
              o.passed
                ? "border-success/20 bg-success/[0.06]"
                : "border-danger/20 bg-danger/[0.06]",
            )}
          >
            <div className="flex items-center gap-1.5">
              {o.passed ? (
                <CircleCheck className="size-3.5 text-success" />
              ) : (
                <CircleX className="size-3.5 text-danger" />
              )}
              <span className="font-medium text-foreground">
                Test {o.index + 1}
              </span>
            </div>
            {!o.passed && (
              <div className="mt-2 space-y-1.5">
                {o.error && <Banner tone="danger">{o.error}</Banner>}
                {o.compileOutput && (
                  <OutputBlock label="Compiler" tone="warning" value={o.compileOutput} />
                )}
                <OutputBlock label="Input" value={o.input} />
                <OutputBlock label="Expected" value={o.expected} />
                <OutputBlock label="Got" value={o.got || "(no output)"} />
                {o.stderr && (
                  <OutputBlock label="Stderr" tone="danger" value={o.stderr} />
                )}
              </div>
            )}
          </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Banner({
  tone,
  children,
}: {
  tone: "danger" | "warning";
  children: React.ReactNode;
}) {
  return (
    <p
      className={cn(
        "rounded-md px-2.5 py-1.5",
        tone === "danger" ? "bg-danger/10 text-danger" : "bg-warning/10 text-warning",
      )}
    >
      {children}
    </p>
  );
}

function OutputBlock({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "danger" | "warning";
}) {
  return (
    <div>
      <span className="text-[0.6875rem] font-medium uppercase tracking-wide text-muted-foreground/70">
        {label}
      </span>
      <pre
        className={cn(
          "mt-0.5 overflow-x-auto whitespace-pre-wrap rounded-md bg-white/[0.04] px-2.5 py-1.5 font-mono text-xs",
          tone === "danger"
            ? "text-danger"
            : tone === "warning"
              ? "text-warning"
              : "text-foreground",
        )}
      >
        {value}
      </pre>
    </div>
  );
}
