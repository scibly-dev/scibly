"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  assemblePracticeDocument,
  type PracticeGrade,
  type PracticeSdkContext,
} from "./assemble-practice-document";
import {
  MIN_HEIGHT_PX,
  parsePracticeMessage,
  type PracticeSelfTestFailure,
} from "./parse-practice-message";

interface PracticeSceneFrameProps {
  html: string;
  sdk: PracticeSdkContext;
  onSubmit?: (work: unknown) => void;
  grade?: PracticeGrade | null;
  /** Releases the app's one-shot submit latch. */
  submitError?: string | null;
  selfTestRun?: number;
  onSelfTestFailed?: (failure: PracticeSelfTestFailure) => void;
  className?: string;
}

export function PracticeSceneFrame({
  html,
  sdk,
  onSubmit,
  grade,
  submitError,
  selfTestRun,
  onSelfTestFailed,
  className,
}: PracticeSceneFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(MIN_HEIGHT_PX);
  const srcDoc = useMemo(
    () => assemblePracticeDocument(html, sdk),
    [html, sdk],
  );
  // A message posted before `load` lands in the initial about:blank window and is lost.
  const [loadedDoc, setLoadedDoc] = useState<string | null>(null);
  const isLive = loadedDoc === srcDoc;

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const message = parsePracticeMessage(event.data);
      if (message?.type === "height") setHeight(message.px);
      else if (message?.type === "submit") onSubmit?.(message.work);
      else if (message?.type === "self-test-failed")
        onSelfTestFailed?.(message);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onSubmit, onSelfTestFailed]);

  useEffect(() => {
    if (!selfTestRun || !isLive) return;
    iframeRef.current?.contentWindow?.postMessage(
      { type: "scibly:self-test" },
      "*",
    );
  }, [selfTestRun, isLive]);

  // A grade the SDK was seeded with (review mode) was already delivered at boot.
  useEffect(() => {
    if (!grade || !isLive || grade === sdk.previous?.grade) return;
    iframeRef.current?.contentWindow?.postMessage(
      { type: "scibly:graded", grade },
      "*",
    );
  }, [grade, isLive, sdk]);

  useEffect(() => {
    if (!submitError || !isLive) return;
    iframeRef.current?.contentWindow?.postMessage(
      { type: "scibly:submit-failed" },
      "*",
    );
  }, [submitError, isLive]);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={srcDoc}
      sandbox="allow-scripts"
      className={className}
      style={{ width: "100%", height, border: "none", display: "block" }}
      title="Practice"
      onLoad={() => setLoadedDoc(srcDoc)}
    />
  );
}
