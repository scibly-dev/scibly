"use client";

import type { NotebookMessage } from "@/features/notebook/chat/contracts";
import type { DevChatScriptPart } from "./demo-chat-transport";

import { Button } from "@scibly/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@scibly/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@scibly/ui/components/dropdown-menu";
import { Input } from "@scibly/ui/components/input";
import { Label } from "@scibly/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@scibly/ui/components/select";
import { Switch } from "@scibly/ui/components/switch";
import { Textarea } from "@scibly/ui/components/textarea";
import { useEffect, useMemo, useRef, useState } from "react";

import { getPendingChatInteraction } from "@/features/notebook/chat/message-list/shared/pending-chat-interaction";
import { useNotebookState } from "@/features/notebook/chat/runtime/context";
import { useComposerPrefill } from "@/features/notebook/workspace/hooks/use-composer-prefill";

import { useShowcaseRuntime } from "./showcase-runtime";

const CUSTOM_TOOL_VALUE = "__custom__";

const TOOL_EXAMPLES = {
  loadSkill: {
    input: { name: "lesson-design" },
    output: {
      content:
        "Use one objective per lesson, a hook-nugget-practice rhythm, and plain examples.",
    },
  },
  searchNotebookSources: {
    input: { query: "phishing urgency password report IT", limit: 4 },
    output: {
      results: [
        {
          sourceId: "source-1",
          sourceName: "Employee handbook",
          offset: 1240,
          content: "Never share your work password by email or chat.",
        },
      ],
    },
  },
  readSource: {
    input: { sourceId: "source-1", offset: 1240 },
    output: { content: "Never share your work password by email or chat." },
  },
  createCourse: {
    input: {
      orgSlug: "acme",
      title: "Cyber safety at work",
      description: "A short course on staying safe online.",
      category: "compliance",
      tags: ["security"],
    },
    output: { id: "course-1", title: "Cyber safety at work" },
  },
  createLesson: {
    input: {
      courseId: "course-1",
      title: "Spotting phishing",
      description: "Learn to recognize phishing attempts.",
      estimatedTimeToCompleteMinutes: 10,
    },
    output: {
      lesson: { id: "lesson-1", title: "Spotting phishing" },
      scenes: [{ id: "scene-1", title: "Intro" }],
    },
  },
  createScene: {
    input: { lessonId: "lesson-1", title: "Practice check" },
    output: { id: "scene-2", title: "Practice check" },
  },
  getEditorSchema: {
    input: {},
    output: {
      schema:
        "Guide character, flashcard, multiple choice, input field, matching pairs, cloze, drag-and-drop, free-form input, image, and inline hint blocks.",
    },
  },
  insertContent: {
    input: {
      sceneId: "scene-1",
      html: "<p>Never share your password.</p>",
      sourceIds: ["source-1"],
    },
    output: { success: true, html: "<p>Never share your password.</p>" },
  },
  listNotebookMedia: {
    input: { limit: 6 },
    output: { items: [], nextCursor: null },
  },
  generateImage: {
    input: {
      prompt: "A calm padlock icon, flat illustration",
      alt: "Padlock icon",
      aspectRatio: "1:1",
    },
    output: {
      imageId: "image-1",
      url: "https://example.com/image.webp",
      prompt: "A calm padlock icon, flat illustration",
      alt: "Padlock icon",
      mediaType: "image/webp",
      aspectRatio: "1:1",
      width: 512,
      height: 512,
      byteSize: 24000,
    },
  },

  askMultipleChoice: {
    input: {
      question: "Which format should we use for the intro scene?",
      options: [
        { label: "Guide character" },
        { label: "Flashcard" },
        { label: "Multiple choice" },
      ],
    },
    output: undefined,
  },
  proposePlan: {
    input: {
      title: "Proposed course structure",
      summary: "A short course covering phishing basics.",
      steps: [
        {
          title: "Create the course shell",
          detail: "Set title, description, and category.",
        },
        { title: "Add the phishing-basics lesson" },
        { title: "Add a practice-check scene" },
      ],
    },
    output: undefined,
  },
};

const KNOWN_TOOL_NAMES = Object.keys(TOOL_EXAMPLES);
const DEFAULT_TOOL_NAME = KNOWN_TOOL_NAMES[0]!;

function isKnownToolName(name: string): name is keyof typeof TOOL_EXAMPLES {
  return Object.hasOwn(TOOL_EXAMPLES, name);
}

function toolExampleJson(name: string) {
  if (!isKnownToolName(name)) return { input: "{}", output: "{}" };
  const example = TOOL_EXAMPLES[name];
  return {
    input: JSON.stringify(example.input, null, 2),
    output:
      example.output === undefined
        ? ""
        : JSON.stringify(example.output, null, 2),
  };
}

type PartKind = "text" | "reasoning" | "tool" | "chatTitle" | "sleep" | "json";

const PART_KINDS: PartKind[] = [
  "text",
  "reasoning",
  "tool",
  "chatTitle",
  "sleep",
  "json",
];

const PART_KIND_LABELS = {
  text: "Text",
  reasoning: "Reasoning",
  tool: "Tool call",
  chatTitle: "Chat title",
  sleep: "Sleep",
  json: "Raw JSON (advanced)",
} satisfies Record<PartKind, string>;

type AssistantPartDraft =
  | { key: number; kind: "text"; text: string; delayMs: string }
  | { key: number; kind: "reasoning"; text: string; delayMs: string }
  | {
      key: number;
      kind: "tool";
      name: string;
      input: string;
      output: string;
      isError: boolean;
      error: string;
    }
  | { key: number; kind: "chatTitle"; title: string }
  | { key: number; kind: "sleep"; delayMs: string }
  | { key: number; kind: "json"; raw: string };

type UserMessageDraft = { key: number; kind: "userMessage"; text: string };

type DevPartDraft = AssistantPartDraft | UserMessageDraft;

function createDraft(kind: PartKind, key: number): AssistantPartDraft {
  switch (kind) {
    case "text":
      return { key, kind, text: "Here is a scripted reply.", delayMs: "" };
    case "reasoning":
      return { key, kind, text: "Thinking out loud...", delayMs: "" };
    case "tool": {
      const { input, output } = toolExampleJson(DEFAULT_TOOL_NAME);
      return {
        key,
        kind,
        name: DEFAULT_TOOL_NAME,
        input,
        output,
        isError: false,
        error: "Something went wrong.",
      };
    }
    case "chatTitle":
      return { key, kind, title: "Scripted title" };
    case "sleep":
      return { key, kind, delayMs: "200" };
    case "json":
      return { key, kind, raw: '{ "type": "chatTitle", "title": "..." }' };
  }
}

function createUserMessageDraft(key: number): UserMessageDraft {
  return { key, kind: "userMessage", text: "Show me another example" };
}

function defaultParts(): DevPartDraft[] {
  return [
    createUserMessageDraft(0),
    createDraft("text", 1),
    createDraft("tool", 2),
  ];
}

const DEFAULT_PARTS_JSON = JSON.stringify(defaultParts());

function isCustomizedScript(parts: DevPartDraft[]): boolean {
  return JSON.stringify(parts) !== DEFAULT_PARTS_JSON;
}

const STORAGE_KEY = "scibly:dev-script-panel:parts";

function loadStoredParts(): DevPartDraft[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    // SAFETY: localStorage only ever holds what this component wrote via

    return parsed as DevPartDraft[];
  } catch {
    return null;
  }
}

function parseJsonField(raw: string, field: string) {
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`"${field}" is not valid JSON.`);
  }
}

function draftToPart(draft: AssistantPartDraft): DevChatScriptPart {
  switch (draft.kind) {
    case "text":
      return {
        type: "text",
        text: draft.text,
        delayMs: draft.delayMs ? Number(draft.delayMs) : undefined,
      };
    case "reasoning":
      return {
        type: "reasoning",
        text: draft.text,
        delayMs: draft.delayMs ? Number(draft.delayMs) : undefined,
      };
    case "tool":
      return {
        type: "tool",
        name: draft.name,
        input: parseJsonField(draft.input, "Tool input"),
        output:
          draft.isError || draft.output.trim() === ""
            ? undefined
            : parseJsonField(draft.output, "Tool output"),
        error: draft.isError
          ? draft.error || "Something went wrong."
          : undefined,
      };
    case "chatTitle":
      return { type: "chatTitle", title: draft.title };
    case "sleep":
      return { type: "sleep", delayMs: Number(draft.delayMs) || 0 };
    case "json": {
      const parsed = parseJsonField(draft.raw, "Raw JSON part");
      // SAFETY: advanced escape hatch for part shapes the builder has no form

      return parsed as DevChatScriptPart;
    }
  }
}

type ScriptedTurn = { userText: string; scriptParts: DevChatScriptPart[] };

/**
 * A turn is safe to advance past once the previous one is fully resolved:
 * no reply streaming, and no live card (multiple-choice, plan, deletion,
 * image approval) still waiting on the real developer to interact with it.
 */
export function isChatSettled(
  messages: NotebookMessage[],
  isLoading: boolean,
): boolean {
  if (isLoading) return false;
  const pending = getPendingChatInteraction(messages);
  return (
    !pending.deletion &&
    !pending.plan &&
    !pending.multipleChoice &&
    !pending.imageGeneration
  );
}

type DraftTurn = {
  userMessage: UserMessageDraft;
  assistantParts: AssistantPartDraft[];
};

// Mirrors applyDevChatScript's own stop condition: a tool part with no
// output and no error leaves the call pending (a live multiple-choice/plan
// card). Parts after it don't stream right away — they play once that card
// is answered and the SDK auto-resubmits, same as a real pending tool call.
function firstPendingToolIndex(assistantParts: AssistantPartDraft[]): number {
  return assistantParts.findIndex(
    (part) =>
      part.kind === "tool" && !part.isError && part.output.trim() === "",
  );
}

function groupDrafts(drafts: DevPartDraft[]) {
  const turns: DraftTurn[] = [];
  const orphans: AssistantPartDraft[] = [];
  for (const draft of drafts) {
    if (draft.kind === "userMessage") {
      turns.push({ userMessage: draft, assistantParts: [] });
      continue;
    }
    const current = turns[turns.length - 1];
    if (current) current.assistantParts.push(draft);
    else orphans.push(draft);
  }
  return { turns, orphans };
}

function TextLikeFields({
  part,
  onChange,
}: {
  part: Extract<AssistantPartDraft, { kind: "text" | "reasoning" }>;
  onChange: (next: AssistantPartDraft) => void;
}) {
  return (
    <div className="space-y-2">
      <Textarea
        className="h-16 text-sm"
        value={part.text}
        onChange={(event) => onChange({ ...part, text: event.target.value })}
      />
      <Input
        type="number"
        placeholder="delay ms (optional)"
        className="w-40 text-xs"
        value={part.delayMs}
        onChange={(event) => onChange({ ...part, delayMs: event.target.value })}
      />
    </div>
  );
}

function ToolFields({
  part,
  onChange,
}: {
  part: Extract<AssistantPartDraft, { kind: "tool" }>;
  onChange: (next: AssistantPartDraft) => void;
}) {
  const isKnownTool = KNOWN_TOOL_NAMES.includes(part.name);
  return (
    <div className="space-y-2">
      <Select
        value={isKnownTool ? part.name : CUSTOM_TOOL_VALUE}
        onValueChange={(value) => {
          if (value === CUSTOM_TOOL_VALUE) {
            onChange({ ...part, name: "" });
            return;
          }
          const { input, output } = toolExampleJson(value);
          onChange({ ...part, name: value, input, output });
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Choose a tool" />
        </SelectTrigger>
        <SelectContent>
          {KNOWN_TOOL_NAMES.map((name) => (
            <SelectItem key={name} value={name}>
              {name}
            </SelectItem>
          ))}
          <SelectItem value={CUSTOM_TOOL_VALUE}>Custom tool…</SelectItem>
        </SelectContent>
      </Select>
      {isKnownTool ? null : (
        <Input
          placeholder="custom tool name"
          value={part.name}
          onChange={(event) => onChange({ ...part, name: event.target.value })}
        />
      )}
      <label className="text-ink-soft flex items-center gap-2 text-xs">
        <Switch
          checked={part.isError}
          onCheckedChange={(checked) => onChange({ ...part, isError: checked })}
        />
        Respond with an error instead of output
      </label>
      <div className="space-y-1">
        <Label className="text-ink-soft text-xs font-normal">
          Input (JSON)
        </Label>
        <Textarea
          className="h-14 font-mono text-xs"
          value={part.input}
          onChange={(event) => onChange({ ...part, input: event.target.value })}
        />
      </div>
      {part.isError ? (
        <div className="space-y-1">
          <Label className="text-ink-soft text-xs font-normal">
            Error message
          </Label>
          <Input
            value={part.error}
            onChange={(event) =>
              onChange({ ...part, error: event.target.value })
            }
          />
        </div>
      ) : (
        <div className="space-y-1">
          <Label className="text-ink-soft text-xs font-normal">
            Output (JSON) — blank leaves the call pending, e.g. for a live
            clickable multiple-choice/plan card
          </Label>
          <Textarea
            className="h-14 font-mono text-xs"
            value={part.output}
            onChange={(event) =>
              onChange({ ...part, output: event.target.value })
            }
          />
        </div>
      )}
    </div>
  );
}

function ChatTitleFields({
  part,
  onChange,
}: {
  part: Extract<AssistantPartDraft, { kind: "chatTitle" }>;
  onChange: (next: AssistantPartDraft) => void;
}) {
  return (
    <Input
      value={part.title}
      onChange={(event) => onChange({ ...part, title: event.target.value })}
    />
  );
}

function SleepFields({
  part,
  onChange,
}: {
  part: Extract<AssistantPartDraft, { kind: "sleep" }>;
  onChange: (next: AssistantPartDraft) => void;
}) {
  return (
    <Input
      type="number"
      className="w-40"
      value={part.delayMs}
      onChange={(event) => onChange({ ...part, delayMs: event.target.value })}
    />
  );
}

function JsonFields({
  part,
  onChange,
}: {
  part: Extract<AssistantPartDraft, { kind: "json" }>;
  onChange: (next: AssistantPartDraft) => void;
}) {
  return (
    <Textarea
      className="h-20 font-mono text-xs"
      value={part.raw}
      onChange={(event) => onChange({ ...part, raw: event.target.value })}
    />
  );
}

function PartCard({
  part,
  onChange,
  onRemove,
  deferred,
}: {
  part: AssistantPartDraft;
  onChange: (next: AssistantPartDraft) => void;
  onRemove: () => void;
  deferred?: boolean;
}) {
  return (
    <div className="border-hairline space-y-2 rounded-lg border-2 p-3">
      <div className="flex items-center justify-between">
        <span className="text-ink-soft text-xs font-semibold tracking-wide uppercase">
          {PART_KIND_LABELS[part.kind]}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-ink-soft hover:text-ink text-xs"
        >
          Remove
        </button>
      </div>
      {deferred ? (
        <p className="text-ink-soft text-xs">
          Plays once the card above is answered — no extra Send needed.
        </p>
      ) : null}
      {part.kind === "text" || part.kind === "reasoning" ? (
        <TextLikeFields part={part} onChange={onChange} />
      ) : part.kind === "tool" ? (
        <ToolFields part={part} onChange={onChange} />
      ) : part.kind === "chatTitle" ? (
        <ChatTitleFields part={part} onChange={onChange} />
      ) : part.kind === "sleep" ? (
        <SleepFields part={part} onChange={onChange} />
      ) : (
        <JsonFields part={part} onChange={onChange} />
      )}
    </div>
  );
}

export function DevScriptPanel() {
  const { devScript } = useShowcaseRuntime();
  const { messages, isLoading } = useNotebookState();
  const [open, setOpen] = useState(false);
  const [parts, setParts] = useState<DevPartDraft[]>(
    () => loadStoredParts() ?? defaultParts(),
  );
  const [error, setError] = useState<string | null>(null);
  const [remainingTurns, setRemainingTurns] = useState<ScriptedTurn[]>([]);
  const nextKey = useRef(Math.max(0, ...parts.map((part) => part.key)) + 1);
  const messageCountAtLastQueue = useRef(0);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parts));
  }, [parts]);

  const { turns, orphans } = useMemo(() => groupDrafts(parts), [parts]);

  const settled = isChatSettled(messages, isLoading);

  useEffect(() => {
    if (remainingTurns.length === 0) return;
    if (messages.length <= messageCountAtLastQueue.current) return;
    if (!settled) return;

    if (devScript?.hasPending()) return;

    const [next, ...rest] = remainingTurns;
    if (next!.scriptParts.length > 0) {
      devScript?.queue({ parts: next!.scriptParts });
    }
    messageCountAtLastQueue.current = messages.length;
    useComposerPrefill.getState().prefill(next!.userText);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRemainingTurns(rest);
  }, [messages, settled, remainingTurns, devScript]);

  function playScript(scriptedTurns: ScriptedTurn[]) {
    const [first, ...rest] = scriptedTurns;
    if (!first) return;
    if (first.scriptParts.length > 0) {
      devScript?.queue({ parts: first.scriptParts });
    }
    messageCountAtLastQueue.current = messages.length;
    useComposerPrefill.getState().prefill(first.userText);
    setRemainingTurns(rest);
  }

  const autoPlayed = useRef(false);
  useEffect(() => {
    if (autoPlayed.current) return;
    autoPlayed.current = true;
    if (!isCustomizedScript(parts)) return;
    if (orphans.length > 0 || turns.length === 0) return;
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      playScript(
        turns.map((turn) => ({
          userText: turn.userMessage.text,
          scriptParts: turn.assistantParts.map(draftToPart),
        })),
      );
    } catch {}

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const preview = useMemo(() => {
    try {
      return JSON.stringify(
        turns.map((turn) => ({
          userMessage: turn.userMessage.text,
          parts: turn.assistantParts.map(draftToPart),
        })),
        null,
        2,
      );
    } catch {
      return "Fix the invalid JSON field above to see a preview.";
    }
  }, [turns]);

  if (!devScript) return null;

  function addPart(kind: PartKind) {
    setParts((prev) => [...prev, createDraft(kind, nextKey.current++)]);
  }

  function addUserMessage() {
    setParts((prev) => [...prev, createUserMessageDraft(nextKey.current++)]);
  }

  function removePart(key: number) {
    setParts((prev) => prev.filter((part) => part.key !== key));
  }

  function updatePart(next: DevPartDraft) {
    setParts((prev) =>
      prev.map((part) => (part.key === next.key ? next : part)),
    );
  }

  function resetParts() {
    setParts(defaultParts());
    setError(null);
    setRemainingTurns([]);
  }

  function run() {
    if (orphans.length > 0) {
      setError('Assistant parts need a "User message" part above them.');
      return;
    }
    if (turns.length === 0) {
      setError(
        'Add at least one "User message" part to start the conversation.',
      );
      return;
    }
    let scriptedTurns: ScriptedTurn[];
    try {
      scriptedTurns = turns.map((turn) => ({
        userText: turn.userMessage.text,
        scriptParts: turn.assistantParts.map(draftToPart),
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Invalid script.");
      return;
    }
    setError(null);
    setOpen(false);
    playScript(scriptedTurns);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="fixed right-4 bottom-4 z-50 shadow-lg"
        >
          Dev script
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Script a dev conversation</DialogTitle>
          <DialogDescription>
            Dev-only: build one or more User message → assistant reply turns
            from parts. Each turn fills the real message box for you — click
            Send there to play it. A tool part left with no output pauses for a
            live multiple-choice/plan card; parts scripted after it resume on
            their own once that card is answered, same as production. Add
            another User message only to script a genuinely new prompt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {orphans.length > 0 ? (
            <div className="space-y-2 rounded-lg border-2 border-amber-300 bg-amber-50 p-3">
              <p className="text-xs font-medium text-amber-800">
                These parts need a &quot;User message&quot; part above them:
              </p>
              {orphans.map((part) => (
                <PartCard
                  key={part.key}
                  part={part}
                  onChange={updatePart}
                  onRemove={() => removePart(part.key)}
                />
              ))}
            </div>
          ) : null}

          {turns.map((turn, index) => {
            const pendingFrom = firstPendingToolIndex(turn.assistantParts);
            return (
              <div
                key={turn.userMessage.key}
                className="bg-ground/40 border-hairline space-y-2 rounded-xl border-2 p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-ink-soft shrink-0 text-xs font-semibold tracking-wide uppercase">
                    Turn {index + 1} · User
                  </span>
                  <Input
                    className="flex-1"
                    value={turn.userMessage.text}
                    onChange={(event) =>
                      updatePart({
                        ...turn.userMessage,
                        text: event.target.value,
                      })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => removePart(turn.userMessage.key)}
                    className="text-ink-soft hover:text-ink shrink-0 text-xs"
                  >
                    Remove
                  </button>
                </div>
                <div className="border-hairline ml-3 space-y-2 border-l-2 pl-3">
                  {turn.assistantParts.map((part, partIndex) => (
                    <PartCard
                      key={part.key}
                      part={part}
                      onChange={updatePart}
                      onRemove={() => removePart(part.key)}
                      deferred={pendingFrom !== -1 && partIndex > pendingFrom}
                    />
                  ))}
                  {turn.assistantParts.length === 0 ? (
                    <p className="text-ink-faint text-xs">
                      No assistant parts yet — add one below.
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}

          {turns.length === 0 && orphans.length === 0 ? (
            <p className="text-ink-faint text-xs">
              Add a &quot;User message&quot; part to start scripting a turn.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addUserMessage}
            >
              + User message
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  + Add assistant part
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {PART_KINDS.map((kind) => (
                  <DropdownMenuItem key={kind} onClick={() => addPart(kind)}>
                    {PART_KIND_LABELS[kind]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <details className="text-xs">
            <summary className="text-ink-soft cursor-pointer select-none">
              Preview JSON
            </summary>
            <pre className="border-hairline mt-2 max-h-40 overflow-auto rounded-lg border-2 p-2 font-mono text-[11px]">
              {preview}
            </pre>
          </details>

          {error ? <p className="text-xs text-red-600">{error}</p> : null}
          <div className="flex gap-2">
            <Button type="button" onClick={run}>
              Queue &amp; play
            </Button>
            <Button type="button" variant="outline" onClick={resetParts}>
              Reset
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
