#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

const EXT = /\.(ts|tsx|js|jsx|mjs|cjs|prisma)$/;
const SKIP = /(^|\/)(node_modules|\.next|\.turbo|dist|build|coverage|generated)(\/|$)|\.d\.ts$|\.gen\./;

const args = process.argv.slice(2);
const json = args.includes("--json");
const limitArg = args.find((a) => a.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : 40;
const diffArg = args.find((a) => a.startsWith("--diff"));
const outArg = args.find((a) => a.startsWith("--out="));
const paths = args.filter((a) => !a.startsWith("--"));

function listFiles() {
  if (diffArg) {
    const base = diffArg.includes("=") ? diffArg.split("=")[1] : "main";
    const out = execFileSync("git", ["diff", "--name-only", `${base}...HEAD`], { encoding: "utf8" });
    return out.split("\n").filter(Boolean);
  }
  const roots = paths.length ? paths : ["."];
  try {
    const out = execFileSync("git", ["ls-files", "-co", "--exclude-standard", "--", ...roots], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const files = out.split("\n").filter(Boolean);
    if (files.length) return files;
  } catch {
    /* not a repo, or paths outside it — walk instead */
  }
  return roots.flatMap(walk);
}

function walk(root) {
  let entries;
  try {
    if (statSync(root).isFile()) return [root];
    entries = readdirSync(root, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries.flatMap((e) => (e.isDirectory() ? walk(join(root, e.name)) : join(root, e.name)));
}

const REGEX_PRECEDERS = /[([{,;:=&|!?+\-*%^~<>]$/;
const REGEX_KEYWORDS = /\b(return|typeof|instanceof|in|of|new|delete|void|throw|case|do|else|yield|await)$/;

// A `/` divides after an operand (identifier, number, `)`/`]`) and opens a regex
// literal everywhere else — the same rule real JS tokenizers use.
function looksLikeRegexStart(codeSoFar) {
  const trimmed = codeSoFar.trimEnd();
  return trimmed === "" || REGEX_PRECEDERS.test(trimmed) || REGEX_KEYWORDS.test(trimmed);
}

function classify(line, inBlock) {
  let i = 0;
  let code = "";
  let commentAt = -1;
  let quote = null;
  while (i < line.length) {
    const c = line[i];
    const next = line[i + 1];
    if (inBlock) {
      if (c === "*" && next === "/") {
        inBlock = false;
        i += 2;
        continue;
      }
      i++;
      continue;
    }
    if (quote) {
      if (c === "\\") i += 2;
      else {
        if (c === quote) quote = null;
        i++;
      }
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      quote = c;
      code += " ";
      i++;
      continue;
    }
    if (c === "/" && next === "/") {
      commentAt = i;
      return { code, commentAt, inBlock, blockOpened: false };
    }
    if (c === "/" && next === "*") {
      commentAt = i;
      inBlock = true;
      i += 2;
      // a block that also closes on this line still counts as comment-here
      while (i < line.length) {
        if (line[i] === "*" && line[i + 1] === "/") {
          inBlock = false;
          i += 2;
          break;
        }
        i++;
      }
      continue;
    }
    if (c === "/" && looksLikeRegexStart(code)) {
      let j = i + 1;
      let inClass = false;
      while (j < line.length) {
        if (line[j] === "\\") {
          j += 2;
        } else if (line[j] === "/" && !inClass) {
          j++;
          break;
        } else {
          if (line[j] === "[") inClass = true;
          if (line[j] === "]") inClass = false;
          j++;
        }
      }
      while (j < line.length && /[a-z]/i.test(line[j])) j++;
      code += " ";
      i = j;
      continue;
    }
    code += c;
    i++;
  }
  return { code, commentAt, inBlock, blockOpened: inBlock };
}

const STOP = new Set(
  ("the a an of to for and or is are be this that we it its from with in on by as if then " +
    "will can not no do does done used use using so but only when where which what into out " +
    "at all any each every here there our their your set get returns return param throws").split(" "),
);

const words = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w.length > 2 && !STOP.has(w));

// Splits identifiers into their parts so `getUserId` matches "get user id".
const codeWords = (s) =>
  new Set(
    s
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter(Boolean),
  );

function scanFile(file) {
  let src;
  try {
    if (statSync(file).size > 2_000_000) return null;
    src = readFileSync(file, "utf8");
  } catch {
    return null;
  }
  const lines = src.split("\n");
  const kind = []; // "code" | "comment" | "blank"
  let inBlock = false;
  for (const line of lines) {
    const started = inBlock;
    const r = classify(line, inBlock);
    const hasCode = r.code.trim().length > 0;
    const hasComment = started || r.commentAt >= 0;
    inBlock = r.inBlock;
    kind.push(hasCode ? "code" : hasComment ? "comment" : line.trim() ? "code" : "blank");
  }

  const runs = [];
  for (let i = 0; i < lines.length; i++) {
    if (kind[i] !== "comment") continue;
    let j = i;
    while (j + 1 < lines.length && kind[j + 1] === "comment") j++;
    const block = lines.slice(i, j + 1);
    const text = block.join(" ").replace(/[/*]+/g, " ").trim();
    const prismaDoc = file.endsWith(".prisma") && block.some((l) => l.trim().startsWith("///"));
    // code the block introduces: lines until the next blank or comment
    let k = j + 1;
    let subject = "";
    let subjectLines = 0;
    while (k < lines.length && kind[k] === "code") {
      subject += " " + lines[k];
      subjectLines++;
      k++;
    }
    runs.push({ start: i + 1, lines: j - i + 1, text, subject, subjectLines, prismaDoc });
    i = j;
  }

  const commentLines = kind.filter((k) => k === "comment").length;
  const codeLines = kind.filter((k) => k === "code").length;
  return { file, runs, commentLines, codeLines };
}

function tag(run) {
  const tags = [];
  const t = run.text;
  // `///` is generated into the Prisma client and shows on hover, so it has a
  // reader a `//` does not. Scores 0: this labels the block, it does not rank it.
  if (run.prismaDoc) tags.push("prisma-doc");
  if (run.lines <= 2 && /[─=*#\-_]{6,}/.test(t)) tags.push("banner");
  if (/@(param|returns?|throws)\b/.test(t)) {
    const restated = (t.match(/@param\s+(\w+)\s+([^@]*)/g) ?? []).some((m) => {
      const [, name, desc] = m.match(/@param\s+(\w+)\s+([^@]*)/) ?? [];
      if (!desc) return false;
      const cw = codeWords(name);
      const dw = words(desc);
      return dw.length > 0 && dw.every((w) => cw.has(w));
    });
    if (restated || /@returns?\s+(the\s+)?(result|value|data|response|output)\b/i.test(t))
      tags.push("jsdoc-restate");
  }
  if (/\bstep\s*\d\b/i.test(t)) tags.push("step-narration");
  if (/\b(previously|used to|no longer|we changed|renamed from|migrated|legacy|refactor)\b/i.test(t))
    tags.push("history");
  if (run.lines >= 4 && run.lines > 2 * run.subjectLines) tags.push("top-heavy");
  const cw = run.subject ? codeWords(run.subject) : new Set();
  const w = words(t);
  if (w.length >= 2 && cw.size) {
    const hit = w.filter((x) => cw.has(x)).length / w.length;
    if (hit >= 0.6) tags.push("echo");
  }
  return tags;
}

const WEIGHT = {
  "prisma-doc": 0,
  banner: 6,
  "jsdoc-restate": 8,
  "step-narration": 5,
  history: 6,
  "top-heavy": 4,
  echo: 8,
};

const files = listFiles().filter((f) => EXT.test(f) && !SKIP.test(f));
const results = [];
const fileStats = [];
for (const f of files) {
  const r = scanFile(f);
  if (!r) continue;
  fileStats.push(r);
  for (const run of r.runs) {
    const tags = tag(run);
    const score = run.lines * 2 + tags.reduce((s, t) => s + WEIGHT[t], 0);
    // A zero-weight tag labels a block without nominating it.
    if (run.lines < 3 && score === run.lines * 2) continue;
    results.push({
      file: r.file,
      line: run.start,
      lines: run.lines,
      subjectLines: run.subjectLines,
      tags,
      score,
      preview: run.text.replace(/\s+/g, " ").slice(0, 90),
    });
  }
}
results.sort((a, b) => b.score - a.score);

const totals = fileStats.reduce(
  (a, f) => ({ comment: a.comment + f.commentLines, code: a.code + f.codeLines }),
  { comment: 0, code: 0 },
);
const worstFiles = fileStats
  .filter((f) => f.codeLines >= 20)
  .map((f) => ({ file: f.file, ratio: f.commentLines / (f.codeLines + f.commentLines), commentLines: f.commentLines }))
  .filter((f) => f.ratio >= 0.25)
  .sort((a, b) => b.commentLines - a.commentLines)
  .slice(0, 15);

const pctOf = (f) => ((f.commentLines / (f.commentLines + f.codeLines || 1)) * 100).toFixed(0);
const statsFor = new Map(fileStats.map((f) => [f.file, f]));

// One ledger file per directory, plus an index that routes to them, so a subagent
// loads its own batch and nothing else.
function writeLedger(root, blocks) {
  const byDir = new Map();
  for (const b of blocks) {
    const dir = dirname(b.file);
    if (!byDir.has(dir)) byDir.set(dir, new Map());
    const byFile = byDir.get(dir);
    if (!byFile.has(b.file)) byFile.set(b.file, []);
    byFile.get(b.file).push(b);
  }
  const dirs = [...byDir.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  if (existsSync(root)) {
    if (!existsSync(join(root, "index.md")) && readdirSync(root).length) {
      console.error(`${root} is not empty and holds no index.md — refusing to overwrite it`);
      process.exit(1);
    }
    rmSync(join(root, "batches"), { recursive: true, force: true });
  }
  mkdirSync(join(root, "batches"), { recursive: true });

  const HOWTO =
    `Each block is a candidate, not a verdict: read the source file, then tick the box and write the outcome after it — \`cut\`, or \`keep — <evidence>\`. ` +
    `Cut is the move on nearly every block: the code is the documentation. A keep needs an external constraint, a business rule, a dependency-bug workaround, a measured perf reason, or an invariant the types can't carry — in one sentence. ` +
    `\`Nc/ML\` is comment lines over the code lines they introduce.`;
  const rows = [];
  for (const [dir, byFile] of dirs) {
    const slug = dir.replace(/[^A-Za-z0-9]+/g, "-") + ".md";
    const list = [...byFile.values()].flat();
    const out = [`# ${dir}`, ``, `${byFile.size} files · ${list.length} blocks`, ``, HOWTO, ``];
    for (const [file, blocksInFile] of [...byFile.entries()].sort()) {
      const s = statsFor.get(file);
      out.push(`## ${basename(file)} — ${s.commentLines} comment lines · ${pctOf(s)}% of file`, ``, `\`${file}\``, ``);
      for (const b of blocksInFile.sort((x, y) => x.line - y.line)) {
        const t = b.tags.length ? ` \`${b.tags.join(" ")}\`` : "";
        out.push(`- [ ] [L${b.line}](${file}#L${b.line}) ${b.lines}c/${b.subjectLines}L${t} — ${b.preview}`);
      }
      out.push(``);
    }
    writeFileSync(join(root, "batches", slug), out.join("\n"));
    rows.push({ dir, slug, files: byFile.size, blocks: list.length });
  }

  const pct = ((totals.comment / (totals.code + totals.comment || 1)) * 100).toFixed(1);
  const index = [
    `# Deslop comment inventory`,
    ``,
    `scope: \`${diffArg ?? (paths.join(" ") || ".")}\``,
    ``,
    `${files.length} files · ${totals.comment} standalone comment lines / ${totals.code} code lines (${pct}%) · ${blocks.length} blocks in ${rows.length} batches`,
    ``,
    `One batch per directory — a unit of work, not a workload, so several small ones can go to the same reader. Take a batch, open only that file, settle every box in it. ${HOWTO}`,
    ``,
    `## Batches`,
    ``,
    `| batch | directory | files | blocks |`,
    `| --- | --- | --- | --- |`,
    ...rows.map((r) => `| [${r.slug}](batches/${r.slug}) | \`${r.dir}\` | ${r.files} | ${r.blocks} |`),
    ``,
  ];
  if (worstFiles.length) {
    index.push(`## Comment-heavy files (≥25% comment lines)`, ``);
    for (const f of worstFiles)
      index.push(`- \`${f.file}\` — ${f.commentLines} comment lines · ${(f.ratio * 100).toFixed(0)}%`);
    index.push(``);
  }
  writeFileSync(join(root, "index.md"), index.join("\n"));
  return rows.length;
}

if (outArg) {
  const root = outArg.split("=")[1];
  const blocks = limitArg ? results.slice(0, limit) : results;
  const batches = writeLedger(root, blocks);
  console.log(
    `${blocks.length} blocks across ${new Set(blocks.map((b) => b.file)).size} files → ${batches} batches in ${root}/`,
  );
} else if (json) {
  console.log(JSON.stringify({ totals, worstFiles, blocks: results.slice(0, limit) }, null, 2));
} else {
  const pct = ((totals.comment / (totals.code + totals.comment || 1)) * 100).toFixed(1);
  console.log(`${files.length} files · ${totals.comment} comment lines / ${totals.code} code lines (${pct}%)\n`);
  console.log(`TOP ${Math.min(limit, results.length)} BLOCKS (of ${results.length} flagged)`);
  for (const r of results.slice(0, limit)) {
    const t = r.tags.length ? ` [${r.tags.join(",")}]` : "";
    console.log(`  ${r.file}:${r.line}  ${r.lines}c/${r.subjectLines}L${t}\n      ${r.preview}`);
  }
  if (worstFiles.length) {
    console.log(`\nCOMMENT-HEAVY FILES (≥25% comment lines)`);
    for (const f of worstFiles)
      console.log(`  ${f.file}  ${f.commentLines} comment lines · ${(f.ratio * 100).toFixed(0)}%`);
  }
}
