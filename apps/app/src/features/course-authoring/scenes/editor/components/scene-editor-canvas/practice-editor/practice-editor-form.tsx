"use client";

import type { PracticeSelfTestFailure } from "@/shared/content/practice/parse-practice-message";
import type { Draft, PracticeData } from "./to-draft";

import { Button } from "@scibly/ui/components/button";
import { Textarea } from "@scibly/ui/components/textarea";
import { cn } from "@scibly/ui/utils";
import { CircleCheck, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import isEqual from "react-fast-compare";
import { useDebouncedCallback } from "use-debounce";

import { useTranslation } from "@/i18n/hooks/use-translation";
import { api } from "@/shared/api/trpc/client";
import {
  ATTEMPT_SDK,
  toPracticeGrade,
} from "@/shared/content/practice/assemble-practice-document";
import { checkPracticeScene } from "@/shared/content/practice/check-practice-scene";
import { PracticeSceneFrame } from "@/shared/content/practice/practice-scene-frame";
import { useSaveState } from "@/shared/ui/hooks/use-save-state";

import { parseSolution } from "./parse-solution";
import { CodeField } from "./practice-code-field";
import { ExplanationNote } from "./practice-explanation-note";
import { GradingReport } from "./practice-grading-report";
import { sameApp } from "./same-app";
import { eyebrowClass, panelClass } from "./styles";
import { toDraft } from "./to-draft";

type TabId = "html" | "solution" | "explanation" | "test";

export function PracticeEditorForm({
  sceneId,
  initial,
  compact,
}: {
  sceneId: string;
  initial: PracticeData;
  compact: boolean;
}) {
  const { translations } = useTranslation("editorUi");
  const copy = translations.practice;
  const utils = api.useUtils();
  const addSave = useSaveState((state) => state.addSave);
  const removeSave = useSaveState((state) => state.removeSave);
  const writePractice = api.scene.writePractice.useMutation();
  const validatePractice = api.scene.validatePractice.useMutation();

  const [tab, setTab] = useState<TabId>("html");
  const [draft, setDraft] = useState<Draft>(() => toDraft(initial));
  const [previewHtml, setPreviewHtml] = useState(initial.html);
  const [runKey, setRunKey] = useState(0);
  const [selfTestRun, setSelfTestRun] = useState(0);
  const [selfTestFailure, setSelfTestFailure] =
    useState<PracticeSelfTestFailure | null>(null);

  // Without the reset the remounted app self-tests itself on load.
  function restartApp() {
    setRunKey((key) => key + 1);
    setSelfTestRun(0);
  }

  const solution = useMemo(
    () => parseSolution(draft.solutionText),
    [draft.solutionText],
  );

  const problems = useMemo(
    () =>
      checkPracticeScene({
        practiceHtml: draft.html,
        practiceSolution: solution.status === "ok" ? solution.value : null,
      }),
    [draft.html, solution],
  );

  const gradedFields = validatePractice.data?.gradedFields;
  const previewGrade = useMemo(
    () => (gradedFields ? toPracticeGrade(gradedFields) : null),
    [gradedFields],
  );

  // An agent writing over MCP refetches `initial` under us: adopt what it wrote,
  // but never clobber keystrokes typed since our own save.
  const savedRef = useRef<Draft>(toDraft(initial));
  useEffect(() => {
    const incoming = toDraft(initial);
    if (isEqual(incoming, savedRef.current)) return;
    savedRef.current = incoming;
    setDraft(incoming);
    setPreviewHtml(incoming.html);
    setSelfTestFailure(null);
    restartApp();
  }, [initial]);

  const save = useDebouncedCallback((next: Draft) => {
    const parsed = parseSolution(next.solutionText);
    if (parsed.status === "error") return;
    const value = parsed.status === "ok" ? parsed.value : null;

    // A stale grade would lie about the new app; an explanation-only edit does not.
    const appChanged = !sameApp(next.html, previewHtml);
    const keyChanged = !isEqual(value, initial.solution ?? null);
    if (appChanged || keyChanged) {
      validatePractice.reset();
      setSelfTestFailure(null);
    }
    if (appChanged) {
      setPreviewHtml(next.html);
      restartApp();
    }

    // Settled off the promise: a flush on unmount fires with the observer already gone.
    addSave();
    // Normalised the way the server echoes it back, so our own refetch is a no-op.
    const saved = toDraft({
      html: next.html,
      solution: value,
      explanation: next.explanation.trim() || null,
    });
    void writePractice
      .mutateAsync({
        sceneId,
        html: next.html,
        solution: value,
        explanation: next.explanation.trim() || null,
      })
      .then(() => {
        // Only now does the server hold this.
        savedRef.current = saved;
        return utils.scene.getPractice.invalidate({ sceneId });
      })
      // Reported by the banner off writePractice.error.
      .catch(() => null)
      .finally(removeSave);
  }, 600);

  // Otherwise the last keystrokes die with the component on scene switch.
  useEffect(() => () => save.flush(), [save]);

  function update(patch: Partial<Draft>) {
    const next = { ...draft, ...patch };
    setDraft(next);
    save(next);
  }

  const tabs: readonly { id: TabId; label: string; hint: string }[] = [
    { id: "html", label: copy.appTab, hint: copy.appHint },
    { id: "solution", label: copy.solutionTab, hint: copy.solutionHint },
    {
      id: "explanation",
      label: copy.explanationTab,
      hint: copy.explanationHint,
    },
    ...(compact
      ? [
          {
            id: "test" as const,
            label: copy.testRunTab,
            hint: copy.testRunHint,
          },
        ]
      : []),
  ];
  // Never undefined: the first three tabs are unconditional.
  const activeTab = tabs.find((entry) => entry.id === tab) ?? tabs[0]!;

  const controls = (
    <div className="flex shrink-0 items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          setSelfTestFailure(null);
          setSelfTestRun((run) => run + 1);
        }}
      >
        <CircleCheck className="size-3.5" />
        {copy.validate}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          validatePractice.reset();
          setSelfTestFailure(null);
          restartApp();
        }}
      >
        <RotateCcw className="size-3.5" />
        {copy.restart}
      </Button>
    </div>
  );

  const testRun = (
    <>
      <PracticeSceneFrame
        key={runKey}
        html={previewHtml}
        sdk={ATTEMPT_SDK}
        onSubmit={(work) => {
          // The banner below reads validatePractice.error.
          validatePractice.mutateAsync({ sceneId, work }).catch(() => null);
        }}
        grade={previewGrade}
        submitError={validatePractice.error?.message ?? null}
        selfTestRun={selfTestRun}
        onSelfTestFailed={setSelfTestFailure}
        className="border-hairline shrink-0 overflow-hidden rounded-xl border-2 bg-white dark:border-neutral-800"
      />
      {selfTestFailure ? (
        <p
          role="alert"
          className="shrink-0 text-[12px] font-medium text-red-600"
        >
          {selfTestFailure.code === "missing"
            ? copy.selfTestMissing
            : copy.selfTestThrew.replace(
                "{error}",
                selfTestFailure.detail ?? "",
              )}
        </p>
      ) : (
        <p
          className={cn(
            "shrink-0 text-[12px] font-medium",
            problems.length === 0 ? "text-emerald-600" : "text-ink-faint",
          )}
        >
          {problems.length === 0
            ? copy.validated
            : copy.notValidated.replace("{problems}", problems.join("; "))}
        </p>
      )}
      <GradingReport
        result={validatePractice.data}
        isPending={validatePractice.isPending}
        isError={validatePractice.isError}
      />
      {validatePractice.data?.explanation ? (
        <ExplanationNote explanation={validatePractice.data.explanation} />
      ) : null}
    </>
  );

  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full overflow-hidden p-4",
        !compact && "gap-4",
      )}
    >
      <section className={cn(panelClass, compact ? "flex-1" : "flex-[3]")}>
        <header
          className={cn(
            "border-hairline flex shrink-0 items-center border-b-2 px-3 dark:border-neutral-800",
            compact ? "min-h-[52px] py-2" : "h-[52px]",
          )}
        >
          <div
            className={cn(
              "bg-ground flex w-full items-center rounded-xl p-1 dark:bg-neutral-950",
              compact && "flex-wrap gap-1",
            )}
          >
            {tabs.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setTab(entry.id)}
                className={cn(
                  "h-8 cursor-pointer rounded-[10px] text-[12px] font-semibold transition-all",
                  compact ? "grow basis-[80px]" : "flex-1",
                  tab === entry.id
                    ? "text-ink bg-white shadow-[0_2px_0_0_var(--color-edge)] dark:bg-neutral-800 dark:text-neutral-100 dark:shadow-none"
                    : "text-ink-muted hover:text-ink dark:hover:text-neutral-300",
                )}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
          <div className="flex shrink-0 items-start justify-between gap-3">
            <p className="text-ink-soft text-[12px] leading-snug">
              {activeTab.hint}
            </p>
            {tab === "test" ? controls : null}
          </div>

          {writePractice.isError ? (
            <p
              role="alert"
              className="shrink-0 text-[12px] font-medium text-red-600"
            >
              {copy.saveFailed}
            </p>
          ) : null}

          {tab === "test" ? (
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
              {testRun}
            </div>
          ) : tab === "html" ? (
            <CodeField
              value={draft.html}
              language="HTML"
              onChange={(html) => update({ html })}
            />
          ) : tab === "solution" ? (
            <>
              <CodeField
                value={draft.solutionText}
                // The vendored Prism bundle ships no `json` grammar.
                language="JavaScript"
                placeholder={'{\n  "answer": { "value": 42, "points": 1 }\n}'}
                onChange={(solutionText) => update({ solutionText })}
              />
              <p
                className={cn(
                  "shrink-0 text-[12px] font-medium",
                  solution.status === "error"
                    ? "text-red-600"
                    : "text-ink-faint",
                )}
              >
                {solution.status === "error"
                  ? copy.solutionNotSaved.replace(
                      "{message}",
                      solution.code === "json"
                        ? copy.solutionInvalidJson
                        : (solution.detail ?? copy.solutionInvalid),
                    )
                  : solution.status === "ok"
                    ? (solution.fields === 1
                        ? copy.solutionValidOne
                        : copy.solutionValid
                      ).replace("{count}", String(solution.fields))
                    : copy.solutionEmpty}
              </p>
            </>
          ) : (
            <Textarea
              value={draft.explanation}
              onChange={(event) => update({ explanation: event.target.value })}
              className="min-h-0 flex-1 resize-none leading-relaxed"
            />
          )}
        </div>
      </section>

      {compact ? null : (
        <section className={cn(panelClass, "flex-[2]")}>
          <header className="border-hairline flex h-[52px] shrink-0 items-center justify-between gap-3 border-b-2 px-5 dark:border-neutral-800">
            <span className={eyebrowClass}>{copy.testRunTab}</span>
            {controls}
          </header>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
            {testRun}
          </div>
        </section>
      )}
    </div>
  );
}
