import { isFieldCorrect } from "./grade-practice-submission";

const PRACTICE_CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.scibly.app",
  "style-src 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.scibly.app",
  "img-src data: blob: https://cdnjs.cloudflare.com https://cdn.scibly.app",
  "font-src data: https://cdnjs.cloudflare.com",
  "connect-src https://cdnjs.cloudflare.com https://cdn.scibly.app",
  // Not covered by default-src: a form submit would navigate off the srcdoc document.
  "form-action 'none'",
].join("; ");

// Copied from packages/ui/src/styles/globals.css; `--font-geist-sans` is a
// Next.js font-loader variable and is unreachable from an isolated iframe.
const PRACTICE_DESIGN_TOKENS_CSS = `
:root {
  --color-ink: #131c46;
  --color-ink-muted: #55608a;
  --color-ink-faint: #8a94b4;
  --color-hairline: #eceae4;
  --color-ground: #f7f6f3;
  --color-ground-soft: #faf9f7;
  --color-blue-500: #0066ff;
  --color-blue-600: #0b52cc;
  --color-green-500: #58cc02;
  --radius-sm: 0.75rem;
  --radius-md: 0.875rem;
  --radius-lg: 1rem;
  --font-sans: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
}
body {
  margin: 0;
  font-family: var(--font-sans);
  color: var(--color-ink);
  background: transparent;
}
`;

// Injected into <head>, so document.body is still null when it runs.
const HEIGHT_BRIDGE_JS = `
(function () {
  var last = 0;
  function post() {
    var h = document.body ? document.body.scrollHeight : 0;
    // The parent resizes the iframe from this, which resizes the body: ignore sub-pixel moves or it loops.
    if (Math.abs(h - last) < 2) return;
    last = h;
    parent.postMessage({ type: "scibly:height", px: h }, "*");
  }
  function start() {
    post();
    if (window.ResizeObserver && document.body) {
      new ResizeObserver(post).observe(document.body);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
  window.addEventListener("load", post);
})();
`;

export type PracticeSdkContext = {
  mode: "attempt" | "review";
  previous: { work: unknown; grade: PracticeGrade | null } | null;
};

// Stable identity: a new object would rebuild the iframe document each render.
export const ATTEMPT_SDK: PracticeSdkContext = {
  mode: "attempt",
  previous: null,
};

export type PracticeGrade = {
  sp: number;
  fields: Record<
    string,
    { correct: boolean; expected: unknown; points: number; maxPoints: number }
  >;
};

export function toPracticeGrade(
  graded: readonly {
    blockId: string;
    achievedPoints: number;
    maxPoints: number;
    spEarned: number;
    correctAnswer?: unknown;
  }[],
): PracticeGrade {
  const fields: PracticeGrade["fields"] = {};
  let sp = 0;
  for (const field of graded) {
    sp += field.spEarned;
    fields[field.blockId] = {
      correct: isFieldCorrect(field),
      expected: field.correctAnswer,
      points: field.achievedPoints,
      maxPoints: field.maxPoints,
    };
  }
  return { sp, fields };
}

// A `</script` inside `previous` would close the injected <script> tag early.
function jsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(/<\/script/gi, "<\\/script");
}

function sdkScript({ mode, previous }: PracticeSdkContext): string {
  return `
window.scibly = (function () {
  var submitted = false;
  var previous = ${jsonForScript(previous)};
  // Held until onGraded registers, so an app that subscribes late still gets its verdict.
  var pending = previous && previous.grade ? previous.grade : null;
  var handler = null;
  function deliver() {
    if (!handler || !pending) return;
    var grade = pending;
    pending = null;
    handler(grade);
  }
  window.addEventListener("message", function (event) {
    if (event.source !== parent) return;
    var data = event.data;
    if (!data) return;
    // Without this a rejected submission leaves the app latched shut, reload the only exit.
    if (data.type === "scibly:submit-failed") {
      submitted = false;
      return;
    }
    // Through the app's own submit(): posting straight to the parent would pass
    // an app whose Submit button is wired to nothing.
    if (data.type === "scibly:self-test") {
      // A code, not a sentence: no dictionary is reachable inside the sandbox.
      if (typeof window.__sciblySelfTest !== "function") {
        parent.postMessage({ type: "scibly:self-test-failed", code: "missing" }, "*");
        return;
      }
      var work;
      try {
        work = window.__sciblySelfTest();
      } catch (error) {
        parent.postMessage({
          type: "scibly:self-test-failed",
          code: "threw",
          detail: String(error),
        }, "*");
        return;
      }
      // Otherwise validating after a manual play needs a restart first.
      submitted = false;
      api.submit(work);
      return;
    }
    if (data.type !== "scibly:graded") return;
    pending = data.grade;
    deliver();
  });
  var api = {
    mode: ${jsonForScript(mode)},
    previous: previous,
    submit: function (work) {
      if (submitted) return;
      submitted = true;
      parent.postMessage({ type: "scibly:submit", work: work }, "*");
    },
    onGraded: function (callback) {
      handler = callback;
      deliver();
    },
  };
  return api;
})();
`;
}

function injectedHead(sdk: PracticeSdkContext): string {
  return [
    `<meta http-equiv="Content-Security-Policy" content="${PRACTICE_CSP}">`,
    `<style>${PRACTICE_DESIGN_TOKENS_CSS}</style>`,
    `<script>${sdkScript(sdk)}</script>`,
    `<script>${HEIGHT_BRIDGE_JS}</script>`,
  ].join("\n");
}

export function assemblePracticeDocument(
  fragment: string,
  sdk: PracticeSdkContext,
): string {
  const injected = injectedHead(sdk);

  const headMatch = fragment.match(/<head[^>]*>/i);
  if (headMatch) {
    const at = headMatch.index! + headMatch[0].length;
    return fragment.slice(0, at) + "\n" + injected + fragment.slice(at);
  }

  const htmlMatch = fragment.match(/<html[^>]*>/i);
  if (htmlMatch) {
    const at = htmlMatch.index! + htmlMatch[0].length;
    return (
      fragment.slice(0, at) +
      `\n<head>${injected}</head>\n` +
      fragment.slice(at)
    );
  }

  return `<!DOCTYPE html><html><head>${injected}</head><body>${fragment}</body></html>`;
}
