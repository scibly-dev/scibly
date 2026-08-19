"use client";

import type { NotebookTranslations } from "../../i18n/notebook.types";
import type { InfographicImageComment } from "./infographic-comments";

import { cn } from "@scibly/ui/utils";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { GeneratedImagePreviewFrame } from "../../media/generated-image/generated-image-preview-frame";
import { InfographicCommentLayer } from "./infographic-comment-overlays";
import { resolveShortSide } from "./infographic-region-geometry";
import { useCommentDrag } from "./use-comment-drag";

interface InfographicCommentedPreviewProps {
  alt: string;
  url: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  comments: InfographicImageComment[];
  activeCommentId: string | null;
  commentMode: boolean;
  labels: NotebookTranslations["studio"]["imageEditor"]["comments"];
  onAddComment: (x: number, y: number, radius: number) => void;
  onSelectComment: (commentId: string) => void;
  onUpdateComment: (commentId: string, text: string) => void;
  onSubmitComment: (commentId: string) => void;
  onDismissComment: (commentId: string) => void;
  onDeleteComment: (commentId: string) => void;
}

function useFrameWidth(frameRef: React.RefObject<HTMLDivElement | null>) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const update = () => setWidth(frame.getBoundingClientRect().width);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [frameRef]);
  return width;
}

export function InfographicCommentedPreview(
  props: InfographicCommentedPreviewProps,
) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null);
  const frameWidth = useFrameWidth(frameRef);
  const { draft, handlePointerDown, handlePointerMove, finishDrag } =
    useCommentDrag({
      commentMode: props.commentMode,
      frameRef,
      onAddComment: props.onAddComment,
    });
  const shortSide = resolveShortSide({
    width: props.width,
    height: props.height,
    aspectRatio: props.aspectRatio,
  });
  return (
    <GeneratedImagePreviewFrame
      ref={frameRef}
      className={cn(
        "border-hairline mx-auto max-h-[calc(100vh-420px)] w-full max-w-[1200px] touch-none rounded-[20px] border-2 bg-white select-none dark:border-neutral-800 dark:bg-neutral-950",
        props.commentMode ? "cursor-crosshair" : "cursor-default",
      )}
      aspectRatio={props.aspectRatio}
      height={props.height}
      width={props.width}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
    >
      <Image
        alt={props.alt}
        className="pointer-events-none object-contain"
        crossOrigin="anonymous"
        fill
        priority
        sizes="(max-width: 1200px) 100vw, 1200px"
        src={props.url}
      />
      <InfographicCommentLayer
        comments={props.comments}
        activeId={props.activeCommentId}
        hoveredId={hoveredCommentId}
        setHoveredId={setHoveredCommentId}
        draft={draft}
        shortSide={shortSide}
        frameWidth={frameWidth}
        labels={props.labels}
        select={props.onSelectComment}
        update={props.onUpdateComment}
        submit={props.onSubmitComment}
        dismiss={props.onDismissComment}
        remove={props.onDeleteComment}
      />
    </GeneratedImagePreviewFrame>
  );
}
