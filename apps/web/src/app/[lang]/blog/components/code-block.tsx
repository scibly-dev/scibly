"use client";

import Icon from "@scibly/ui/components/icon";
import { useCopyFeedback } from "@scibly/ui/hooks/use-copy-feedback";
import Prism from "prismjs";
import React, { useMemo } from "react";

import "prismjs/themes/prism-tomorrow.css";
// Import Prism core languages
import "prismjs/components/prism-bash";
import "prismjs/components/prism-css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-json";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-python";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-yaml";

type SupportedLanguage =
  | "javascript"
  | "typescript"
  | "tsx"
  | "jsx"
  | "css"
  | "json"
  | "bash"
  | "markdown"
  | "python"
  | "sql"
  | "yaml"
  | "rust"
  | "markup";

type LanguageAlias =
  | "js"
  | "javascript"
  | "ts"
  | "typescript"
  | "tsx"
  | "jsx"
  | "css"
  | "json"
  | "bash"
  | "sh"
  | "shell"
  | "md"
  | "markdown"
  | "py"
  | "python"
  | "sql"
  | "yaml"
  | "yml"
  | "rust"
  | "rs"
  | "html"
  | "xml"
  | "svg"
  | "markup";

type LanguageDisplayName =
  | "JavaScript"
  | "TypeScript"
  | "TSX"
  | "JSX"
  | "CSS"
  | "JSON"
  | "Bash"
  | "Shell"
  | "Markdown"
  | "Python"
  | "SQL"
  | "YAML"
  | "Rust"
  | "HTML"
  | "XML"
  | "SVG";

const SUPPORTED_LANGUAGES = {
  js: "javascript",
  javascript: "javascript",
  ts: "typescript",
  typescript: "typescript",
  tsx: "tsx",
  jsx: "jsx",
  css: "css",
  json: "json",
  bash: "bash",
  sh: "bash",
  shell: "bash",
  md: "markdown",
  markdown: "markdown",
  py: "python",
  python: "python",
  sql: "sql",
  yaml: "yaml",
  yml: "yaml",
  rust: "rust",
  rs: "rust",
  html: "markup",
  xml: "markup",
  svg: "markup",
  markup: "markup",
} as const satisfies Record<LanguageAlias, SupportedLanguage>;

const RAW_TO_DISPLAY_NAME = {
  js: "JavaScript",
  javascript: "JavaScript",
  ts: "TypeScript",
  typescript: "TypeScript",
  tsx: "TSX",
  jsx: "JSX",
  css: "CSS",
  json: "JSON",
  bash: "Bash",
  sh: "Shell",
  shell: "Shell",
  md: "Markdown",
  markdown: "Markdown",
  py: "Python",
  python: "Python",
  sql: "SQL",
  yaml: "YAML",
  yml: "YAML",
  rust: "Rust",
  rs: "Rust",
  html: "HTML",
  xml: "XML",
  svg: "SVG",
  markup: "HTML",
} as const satisfies Record<LanguageAlias, LanguageDisplayName>;

const isLanguageAlias = (raw: string): raw is LanguageAlias =>
  raw in SUPPORTED_LANGUAGES;

interface CodeBlockProps {
  children: string;
  className?: string;
}

export function CodeBlock({ children, className }: CodeBlockProps) {
  const { copied, copy } = useCopyFeedback();

  const rawLanguage = className ? className.replace(/language-/, "") : "";

  const language = useMemo<SupportedLanguage | "">(() => {
    const alias = rawLanguage.toLowerCase();
    return isLanguageAlias(alias) ? SUPPORTED_LANGUAGES[alias] : "";
  }, [rawLanguage]);

  const highlightedHtml = useMemo(() => {
    if (!language) return null;
    const grammar = Prism.languages[language];
    if (!grammar) return null;
    try {
      return Prism.highlight(children.trim(), grammar, language);
    } catch (e) {
      console.error("Prism highlighting error:", e);
      return null;
    }
  }, [children, language]);

  const displayLanguage = useMemo(() => {
    const alias = rawLanguage.toLowerCase();
    return isLanguageAlias(alias) ? RAW_TO_DISPLAY_NAME[alias] : rawLanguage;
  }, [rawLanguage]);

  const preClassName = `m-0 overflow-x-auto p-5 font-mono text-[13.5px] leading-relaxed select-text !bg-transparent language-${language || "text"}`;

  return (
    <div className="bg-ink relative my-7 overflow-hidden rounded-[18px] border-2 border-[#1e2a5e] text-neutral-200 shadow-[0_4px_0_0_var(--color-hairline)]">
      {/* Apple-style window header */}
      <div className="flex items-center justify-between border-b-2 border-white/10 bg-black/15 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
          <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
          <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
          {displayLanguage && (
            <span className="ml-3.5 font-mono text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
              {displayLanguage}
            </span>
          )}
        </div>
        <button
          onClick={() => copy(children.trim())}
          className="flex cursor-pointer items-center gap-1.5 rounded px-2.5 py-1 text-xs text-neutral-400 transition-colors duration-200 hover:bg-neutral-800 hover:text-white"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Icon name="Check" className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[11px] font-medium text-emerald-400">
                Copied
              </span>
            </>
          ) : (
            <>
              <Icon name="Copy" className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium">Copy</span>
            </>
          )}
        </button>
      </div>
      {/* Code body */}
      <pre className={preClassName} tabIndex={0}>
        {highlightedHtml ? (
          <code
            className={`language-${language}`}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        ) : (
          <code className={className}>{children}</code>
        )}
      </pre>
    </div>
  );
}
