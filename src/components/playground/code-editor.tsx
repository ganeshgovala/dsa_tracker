"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { Monaco } from "@monaco-editor/react";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full place-items-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    ),
  },
);

function defineTheme(monaco: Monaco) {
  monaco.editor.defineTheme("algo-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#17171c",
      "editorGutter.background": "#17171c",
      "editor.lineHighlightBackground": "#ffffff0a",
      "editor.lineHighlightBorder": "#00000000",
      "editorLineNumber.foreground": "#5b5b66",
      "editorLineNumber.activeForeground": "#b4b4c0",
      "editorIndentGuide.background1": "#ffffff10",
      "editorWidget.background": "#1c1c22",
      "editorSuggestWidget.background": "#1c1c22",
      "scrollbarSlider.background": "#ffffff14",
    },
  });
}

export function CodeEditor({
  language,
  value,
  onChange,
}: {
  language: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <MonacoEditor
      height="100%"
      language={language}
      theme="algo-dark"
      value={value}
      onChange={(v) => onChange(v ?? "")}
      beforeMount={defineTheme}
      options={{
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 13,
        fontFamily:
          "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace",
        fontLigatures: true,
        lineNumbersMinChars: 3,
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        cursorBlinking: "smooth",
        renderLineHighlight: "all",
        tabSize: 4,
        padding: { top: 14, bottom: 14 },
        fixedOverflowWidgets: true,
        scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
        overviewRulerLanes: 0,
      }}
    />
  );
}
