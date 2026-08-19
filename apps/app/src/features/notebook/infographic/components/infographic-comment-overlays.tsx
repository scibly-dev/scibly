"use client";

import type { NotebookTranslations } from "../../i18n/notebook.types";
import type { InfographicImageComment } from "./infographic-comments";
import type { useCommentDrag } from "./use-comment-drag";

import { cn } from "@scibly/ui/utils";
import { ArrowUp, MessageCircle, Trash2 } from "lucide-react";

import {
  computePopoverLeft,
  regionCircleStyle,
  type resolveShortSide,
} from "./infographic-region-geometry";

type Labels = NotebookTranslations["studio"]["imageEditor"]["comments"];

export const CommentMarkers = ({
  comments,
  activeId,
  hovered,
  setHovered,
  labels,
  select,
  stopPointer,
}: {
  comments: InfographicImageComment[];
  activeId: string | null;
  hovered: string | null;
  setHovered: (id: string | null) => void;
  labels: Labels;
  select: (id: string) => void;
  stopPointer: (event: React.PointerEvent) => void;
}) => {
  return (
    <>
      {comments.map((comment, index) => {
        const active = comment.id === activeId;
        const hasText = Boolean(comment.text.trim());
        return (
          <button
            key={comment.id}
            type="button"
            aria-label={labels.markerLabel.replace(
              "{index}",
              String(index + 1),
            )}
            className={cn(
              "absolute z-10 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[11px] font-bold transition-transform outline-none",
              "ring-2 ring-white focus:outline-none focus-visible:outline-none",
              "bg-[#0066ff] text-white shadow-[0_2px_0_0_#0046ad]",
              active && "scale-110",
            )}
            style={{ left: `${comment.x}%`, top: `${comment.y}%` }}
            onPointerDown={stopPointer}
            onPointerEnter={() => setHovered(comment.id)}
            onPointerLeave={() => {
              if (hovered === comment.id) setHovered(null);
            }}
            onClick={(event) => {
              event.stopPropagation();
              select(comment.id);
            }}
          >
            {hasText ? (
              <MessageCircle className="h-3 w-3" strokeWidth={2.25} />
            ) : (
              index + 1
            )}
          </button>
        );
      })}
    </>
  );
};

export const CommentPreviews = ({
  comments,
  activeId,
  hoveredId,
}: {
  comments: InfographicImageComment[];
  activeId: string | null;
  hoveredId: string | null;
}) => {
  return (
    <>
      {comments.map((comment) => {
        if (
          !comment.text.trim() ||
          comment.id !== hoveredId ||
          comment.id === activeId
        )
          return null;
        return (
          <div
            key={`preview-${comment.id}`}
            aria-hidden
            className={cn(
              "border-hairline text-ink pointer-events-none absolute z-20 max-w-[12rem] -translate-y-1/2 rounded-xl border-2 bg-white px-3 py-1.5 text-[13px] leading-snug font-medium shadow-[0_2px_0_0_var(--color-lip)] dark:bg-neutral-950 dark:text-neutral-100",
              comment.x > 55
                ? "-translate-x-[calc(100%+14px)] text-right"
                : "translate-x-[14px]",
            )}
            style={{ left: `${comment.x}%`, top: `${comment.y}%` }}
          >
            {comment.text}
          </div>
        );
      })}
    </>
  );
};

export const CommentPopover = ({
  comment,
  frameWidth,
  labels,
  update,
  submit,
  dismiss,
  remove,
  stopPointer,
}: {
  comment: InfographicImageComment | undefined;
  frameWidth: number;
  labels: Labels;
  update: (id: string, text: string) => void;
  submit: (id: string) => void;
  dismiss: (id: string) => void;
  remove: (id: string) => void;
  stopPointer: (event: React.PointerEvent) => void;
}) => {
  const position = comment ? computePopoverLeft(comment.x, frameWidth) : null;
  if (!comment || !position) return null;
  return (
    <div
      className="border-hairline absolute z-20 flex -translate-y-1/2 items-center gap-1 rounded-xl border-2 bg-white py-1 pr-1 pl-4 shadow-[0_3px_0_0_var(--color-edge)] dark:border-neutral-700 dark:bg-neutral-950"
      style={{
        left: position.left,
        width: position.width,
        top: `${Math.min(Math.max(comment.y, 12), 88)}%`,
      }}
      onPointerDown={stopPointer}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <input
        autoFocus
        value={comment.text}
        placeholder={labels.addPlaceholder}
        className="text-ink placeholder:text-ink-faint min-w-0 flex-1 bg-transparent text-[13px] outline-none dark:text-neutral-100 dark:placeholder:text-neutral-500"
        onChange={(event) => update(comment.id, event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            submit(comment.id);
          }
          if (event.key === "Escape") {
            event.preventDefault();
            dismiss(comment.id);
          }
        }}
      />
      <button
        type="button"
        aria-label={labels.saveComment}
        disabled={!comment.text.trim()}
        className="ease-press flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] bg-[#0066ff] text-white shadow-[0_2px_0_0_#0046ad] transition-[translate,box-shadow,opacity] duration-100 hover:bg-[#1a76ff] active:translate-y-[2px] active:shadow-none disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900"
        onClick={() => submit(comment.id)}
      >
        <ArrowUp className="h-3.5 w-3.5" />
      </button>
      <span
        aria-hidden
        className="bg-hairline mx-0.5 h-4 w-px dark:bg-neutral-700"
      />
      <button
        type="button"
        aria-label={labels.deleteComment}
        className="text-ink-faint flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-transparent dark:hover:text-red-400"
        onClick={() => remove(comment.id)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export function InfographicCommentLayer(props: {
  comments: InfographicImageComment[];
  activeId: string | null;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  draft: ReturnType<typeof useCommentDrag>["draft"];
  shortSide: ReturnType<typeof resolveShortSide>;
  frameWidth: number;
  labels: Labels;
  select: (id: string) => void;
  update: (id: string, text: string) => void;
  submit: (id: string) => void;
  dismiss: (id: string) => void;
  remove: (id: string) => void;
}) {
  const active = props.comments.find(
    (comment) => comment.id === props.activeId,
  );
  const stopPointer = (event: React.PointerEvent) => event.stopPropagation();
  return (
    <>
      {props.draft ? (
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-full border-2 border-dashed border-[#0066ff] bg-[#0066ff]/15 dark:border-white/80 dark:bg-white/15"
          style={regionCircleStyle(
            props.draft.x,
            props.draft.y,
            Math.max(props.draft.radius, 1),
            props.shortSide,
          )}
        />
      ) : null}
      <CommentMarkers
        comments={props.comments}
        activeId={props.activeId}
        hovered={props.hoveredId}
        setHovered={props.setHoveredId}
        labels={props.labels}
        select={props.select}
        stopPointer={stopPointer}
      />
      <CommentPreviews
        comments={props.comments}
        activeId={props.activeId}
        hoveredId={props.hoveredId}
      />
      <CommentPopover
        comment={active}
        frameWidth={props.frameWidth}
        labels={props.labels}
        update={props.update}
        submit={props.submit}
        dismiss={props.dismiss}
        remove={props.remove}
        stopPointer={stopPointer}
      />
    </>
  );
}
