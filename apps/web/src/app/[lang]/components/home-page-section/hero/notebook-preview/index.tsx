"use client";

import { useInView, useReducedMotion } from "framer-motion";
import { useRef, useState } from "react";

import { useDemoTimeline } from "@/components/use-demo-timeline";

import { HeroPreviewStage } from "../hero-preview-stage";
import { ChatPanel, type DemoPhase } from "./chat-panel";
import { DemoCursor, useDemoCursor } from "./demo-cursor";
import { type NotebookCopy } from "./notebook-copy";
import { NotebookSidebar } from "./notebook-sidebar";
import { CURSOR_MOVE_SECONDS } from "./notebook-theme";
import { type RightTab, SourcesPanel } from "./sources-panel";

const CURSOR_TRAVEL_MS = CURSOR_MOVE_SECONDS * 1000;

export function HeroNotebookPreview({ t }: { t: NotebookCopy }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const optionTwoRef = useRef<HTMLDivElement>(null);
  const submitRef = useRef<HTMLDivElement>(null);
  const sourceOneRef = useRef<HTMLDivElement>(null);
  const studioTabRef = useRef<HTMLButtonElement>(null);
  const inView = useInView(rootRef, { amount: 0.35 });
  const reduceMotion = useReducedMotion();

  const pointer = useDemoCursor(frameRef);
  const [selectedOption, setSelectedOption] = useState(-1);
  const [submitPulse, setSubmitPulse] = useState(false);
  const [phase, setPhase] = useState<DemoPhase>("quiz");
  const [showCitations, setShowCitations] = useState(false);
  const [sourceHighlight, setSourceHighlight] = useState(false);
  const [rightTab, setRightTab] = useState<RightTab>("sources");
  const [studioProgress, setStudioProgress] = useState(28);
  const [studioScenes, setStudioScenes] = useState(0);

  useDemoTimeline(!reduceMotion && inView, async (wait) => {
    await wait(1100);

    setPhase("quiz");
    setSelectedOption(-1);
    setSubmitPulse(false);
    setShowCitations(false);
    setSourceHighlight(false);
    setRightTab("sources");
    setStudioProgress(28);
    setStudioScenes(0);
    pointer.release();
    await wait(700);

    const optionPoint = await pointer.aimAt(
      wait,
      optionTwoRef.current,
      "radio",
      500,
    );
    if (!optionPoint) return;
    await wait(CURSOR_TRAVEL_MS + 900);
    await pointer.clickAt(wait, optionPoint);
    setSelectedOption(1);
    await wait(1100);

    const sendPoint = await pointer.aimAt(wait, submitRef.current);
    if (!sendPoint) return;
    await wait(CURSOR_TRAVEL_MS + 800);
    setSubmitPulse(true);
    await pointer.clickAt(wait, sendPoint);

    setPhase("thinking");
    pointer.hide();
    await wait(1400);
    setPhase("followUp");
    await wait(900);

    setShowCitations(true);
    await wait(1100);

    const sourcePoint = await pointer.aimAt(wait, sourceOneRef.current);
    if (sourcePoint) {
      await wait(CURSOR_TRAVEL_MS + 500);
      await pointer.clickAt(wait, sourcePoint);
      setSourceHighlight(true);
      await wait(1400);
    }

    const studioPoint = await pointer.aimAt(wait, studioTabRef.current);
    if (studioPoint) {
      await wait(CURSOR_TRAVEL_MS + 400);
      await pointer.clickAt(wait, studioPoint);
      setRightTab("studio");
      pointer.hide();
      await wait(450);

      setStudioScenes(1);
      setStudioProgress(48);
      await wait(700);
      setStudioScenes(2);
      setStudioProgress(68);
      await wait(700);
      setStudioScenes(3);
      setStudioProgress(88);
      await wait(2200);
    } else {
      await wait(1600);
    }

    setSubmitPulse(false);
  });

  return (
    <HeroPreviewStage
      rootRef={rootRef}
      frameRef={frameRef}
      riseDelay="100ms"
      frameClassName="flex"
    >
      <NotebookSidebar t={t} />
      <ChatPanel
        t={t}
        selectedOption={selectedOption}
        phase={phase}
        submitPulse={submitPulse}
        showCitations={showCitations}
        optionTwoRef={optionTwoRef}
        submitRef={submitRef}
      />
      <SourcesPanel
        t={t}
        tab={rightTab}
        sourceHighlight={sourceHighlight}
        studioProgress={studioProgress}
        studioScenes={studioScenes}
        sourceOneRef={sourceOneRef}
        studioTabRef={studioTabRef}
      />

      <DemoCursor
        x={pointer.cursor.x}
        y={pointer.cursor.y}
        visible={!reduceMotion && pointer.cursor.visible && inView}
        pressing={pointer.pressing}
        ripple={pointer.ripple}
      />
    </HeroPreviewStage>
  );
}
