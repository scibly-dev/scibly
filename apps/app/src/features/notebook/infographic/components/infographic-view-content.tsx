"use client";

import type { NotebookTranslations } from "../../i18n/notebook.types";
import type { InfographicPreviewState } from "./resolve-infographic-preview-state";
import type { useInfographicComments } from "./use-infographic-comments";
import type { useInfographicImages } from "./use-infographic-images";

import { Button } from "@scibly/ui/components/button";
import {
  chipActiveClass,
  chipClass,
  chipRestClass,
  fieldClass,
} from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import { ArrowLeft, Loader2, MessageCirclePlus } from "lucide-react";

import {
  notebookBorder,
  notebookIconButton,
} from "../../workspace/components/notebook-shell";
import { InfographicAspectRatioPicker } from "./infographic-aspect-ratio-picker";
import { InfographicCommentedPreview } from "./infographic-commented-preview";
import { InfographicCommentsPanel } from "./infographic-comments-panel";
import { InfographicImageRail } from "./infographic-image-rail";
import { InfographicPanelImageFrame } from "./infographic-panel-image-frame";

type ImagesController = ReturnType<typeof useInfographicImages>;
type CommentsController = ReturnType<typeof useInfographicComments>;
type InfographicImage = ImagesController["images"][number];

interface InfographicViewContentProps {
  t: NotebookTranslations;
  isLoading: boolean;
  imagesController: ImagesController;
  commentsController: CommentsController;
  activeImageId: string | null;
  selectedImage: InfographicImage | null;
  previewState: InfographicPreviewState;
  showImageWorkspace: boolean;
  prompt: string;
  currentAspectRatio: string | undefined;
  onExit: () => void;
  onToggleCommentMode: () => void;
  onAspectRatioSelect: (ratio: string, label: string) => void;
  onSelectImage: (imageId: string) => void;
  onPromptChange: (prompt: string) => void;
  onSubmit: () => void;
}

export const ImageWorkspace = (props: InfographicViewContentProps) => {
  const {
    t,
    imagesController,
    commentsController,
    activeImageId,
    selectedImage,
    previewState,
    onSelectImage,
  } = props;
  if (!props.showImageWorkspace) return null;
  const labels = t.studio.imageEditor;
  return (
    <div className="flex min-h-0 gap-3">
      <InfographicImageRail
        activeImageId={activeImageId}
        generatingLabel={t.chat.imageGeneration.generating}
        images={imagesController.images}
        isFetchingNextPage={imagesController.isFetchingNextPage}
        loadMoreRef={imagesController.loadMoreRef}
        onSelect={onSelectImage}
        selectImageLabel={labels.selectImage}
        setScrollRoot={imagesController.setRailScrollRoot}
      />
      <div className="min-w-0 flex-1">
        {previewState === "ready" && selectedImage?.output?.url ? (
          <InfographicCommentedPreview
            activeCommentId={commentsController.visibleActiveCommentId}
            alt={selectedImage.output.alt ?? selectedImage.alt ?? ""}
            aspectRatio={selectedImage.output.aspectRatio}
            commentMode={commentsController.commentMode}
            comments={commentsController.comments}
            height={selectedImage.output.height}
            labels={labels.comments}
            url={selectedImage.output.url}
            width={selectedImage.output.width}
            onAddComment={commentsController.handleAddComment}
            onDeleteComment={commentsController.handleDeleteComment}
            onDismissComment={commentsController.handleDismissComment}
            onSelectComment={commentsController.setActiveCommentId}
            onSubmitComment={commentsController.handleSubmitComment}
            onUpdateComment={commentsController.handleUpdateComment}
          />
        ) : previewState === "loading" || previewState === "error" ? (
          <InfographicPanelImageFrame
            alt={selectedImage?.output?.alt ?? selectedImage?.alt}
            aspectRatio={selectedImage?.output?.aspectRatio}
            errorText={selectedImage?.errorText}
            height={selectedImage?.output?.height}
            labels={t.chat.imageGeneration}
            state={previewState === "loading" ? "loading" : "error"}
            width={selectedImage?.output?.width}
          />
        ) : imagesController.isLoading ? (
          <div className="mx-auto flex min-h-[240px] w-full max-w-[1200px] items-center justify-center rounded-[20px]">
            <Loader2 className="text-ink-faint h-6 w-6 animate-spin" />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export const PromptOrComments = (props: InfographicViewContentProps) => {
  const { commentsController, isLoading, prompt, onPromptChange, onSubmit } =
    props;
  const labels = props.t.studio.imageEditor;
  if (commentsController.comments.length > 0) {
    return (
      <InfographicCommentsPanel
        additionalNotes={commentsController.additionalNotes}
        comments={commentsController.comments}
        disabled={isLoading}
        labels={labels.comments}
        onAdditionalNotesChange={commentsController.handleAdditionalNotesChange}
        onClearAll={commentsController.handleClearComments}
        onSend={commentsController.handleSendComments}
      />
    );
  }
  return (
    <>
      <textarea
        value={prompt}
        onChange={(event) => onPromptChange(event.currentTarget.value)}
        placeholder={labels.promptPlaceholder}
        rows={4}
        className={cn(
          fieldClass,
          "w-full resize-none rounded-xl px-3 py-2.5 text-sm",
          "dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500",
        )}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSubmit();
          }
        }}
      />
      <Button
        type="button"
        disabled={!prompt.trim() || isLoading}
        onClick={onSubmit}
        className="w-full focus-visible:ring-0 focus-visible:ring-offset-0"
      >
        {labels.send}
      </Button>
    </>
  );
};

export function InfographicViewContent(props: InfographicViewContentProps) {
  const labels = props.t.studio.imageEditor;
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-neutral-950">
      <div
        className={cn(
          "flex items-center gap-1.5 border-b-2 px-4 py-3",
          notebookBorder,
        )}
      >
        <button
          type="button"
          onClick={props.onExit}
          title={labels.back}
          className={cn(
            "-ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md outline-none focus:outline-none focus-visible:outline-none",
            notebookIconButton,
          )}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>
        <p className="text-ink-faint text-[10px] font-bold tracking-widest uppercase dark:text-neutral-500">
          {props.t.studio.tools.imageEditor}
        </p>
      </div>
      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        {props.previewState === "ready" ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={props.isLoading}
              onClick={props.onToggleCommentMode}
              aria-pressed={props.commentsController.commentMode}
              className={cn(
                chipClass,
                "inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50",
                props.commentsController.commentMode
                  ? chipActiveClass
                  : `${chipRestClass} dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100`,
              )}
            >
              <MessageCirclePlus className="h-4 w-4" />
              <span>{labels.comments.commentButton}</span>
            </button>
            <InfographicAspectRatioPicker
              currentAspectRatio={props.currentAspectRatio}
              disabled={props.isLoading}
              labels={labels.aspectRatio}
              onSelect={props.onAspectRatioSelect}
            />
          </div>
        ) : null}
        <ImageWorkspace {...props} />
        <div className="mt-auto flex flex-col gap-2">
          <PromptOrComments {...props} />
        </div>
      </div>
    </div>
  );
}
