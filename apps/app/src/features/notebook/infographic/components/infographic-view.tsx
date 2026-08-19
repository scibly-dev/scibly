"use client";

import type { NotebookTranslations } from "../../i18n/notebook.types";
import type { InfographicImage } from "./merge-infographic-images";

import { useMemo, useState } from "react";

import {
  useNotebookActions,
  useNotebookState,
} from "../../chat/runtime/context";
import { useSidebarState } from "../../workspace/hooks/use-sidebar-state";
import { InfographicViewContent } from "./infographic-view-content";
import { resolveInfographicPreviewState } from "./resolve-infographic-preview-state";
import { sendImageEdit } from "./send-image-edit";
import { useInfographicComments } from "./use-infographic-comments";
import { useInfographicImageSelection } from "./use-infographic-image-selection";
import { useInfographicImages } from "./use-infographic-images";

interface InfographicViewProps {
  orgSlug: string;
  notebookId: string | undefined;
  t: NotebookTranslations;
  onExit?: () => void;
}

function useInfographicEditActions(params: {
  prompt: string;
  setPrompt: (value: string) => void;
  isLoading: boolean;
  sourceImageId: string | undefined;
  selectedImage: InfographicImage | null;
  previewState: ReturnType<typeof resolveInfographicPreviewState>;
  labels: NotebookTranslations["studio"]["imageEditor"];
  sendMessage: ReturnType<typeof useNotebookActions>["sendMessage"];
  followNewest: () => void;
}) {
  const submit = () => {
    const text = params.prompt.trim();
    if (!text || params.isLoading) return;
    if (params.sourceImageId) {
      params.followNewest();
      void sendImageEdit({
        sendMessage: params.sendMessage,
        sourceImageId: params.sourceImageId,
        alt:
          params.selectedImage?.output?.alt ?? params.selectedImage?.alt ?? "",
        prompt: text,
        userText: text,
      });
    } else void params.sendMessage({ text });
    params.setPrompt("");
  };
  const selectAspectRatio = (ratio: string, label: string) => {
    if (
      params.isLoading ||
      params.previewState !== "ready" ||
      ratio === params.selectedImage?.output?.aspectRatio ||
      !params.sourceImageId
    )
      return;
    const prompt = params.labels.aspectRatio.prompt
      .replace("{label}", label)
      .replace("{ratio}", ratio);
    params.followNewest();
    void sendImageEdit({
      sendMessage: params.sendMessage,
      sourceImageId: params.sourceImageId,
      alt: params.selectedImage?.output?.alt ?? params.selectedImage?.alt ?? "",
      prompt,
      userText: prompt,
    });
  };
  return { submit, selectAspectRatio };
}

function useInfographicWorkspace(params: {
  images: InfographicImage[];
  imagesLoading: boolean;
  chatLoading: boolean;
  labels: NotebookTranslations["studio"]["imageEditor"];
  sendMessage: ReturnType<typeof useNotebookActions>["sendMessage"];
  prompt: string;
  setPrompt: (value: string) => void;
}) {
  const selection = useInfographicImageSelection(
    params.images,
    params.chatLoading,
  );
  const selectedImage = useMemo(
    () =>
      params.images.find((image) => image.id === selection.activeImageId) ??
      params.images[0] ??
      null,
    [params.images, selection.activeImageId],
  );
  const previewState = resolveInfographicPreviewState(
    selectedImage,
    params.imagesLoading,
    selection.awaitingNewGeneration,
  );
  const comments = useInfographicComments({
    activeImageId: selection.activeImageId,
    previewReady: previewState === "ready",
    isLoading: params.chatLoading,
    labels: params.labels,
    sendMessage: params.sendMessage,
    selectedImage,
    onBeforeSendEdit: selection.followNewestGeneration,
  });
  const actions = useInfographicEditActions({
    prompt: params.prompt,
    setPrompt: params.setPrompt,
    isLoading: params.chatLoading,
    sourceImageId: selectedImage?.output?.imageId,
    selectedImage,
    previewState,
    labels: params.labels,
    sendMessage: params.sendMessage,
    followNewest: selection.followNewestGeneration,
  });
  return { selection, selectedImage, previewState, comments, actions };
}

export function InfographicView({
  t,
  orgSlug,
  notebookId,
  onExit,
}: InfographicViewProps) {
  const labels = t.studio.imageEditor;
  const { isLoading } = useNotebookState();
  const { sendMessage } = useNotebookActions();
  const {
    images,
    isLoading: isImagesLoading,
    isFetchingNextPage,
    loadMoreRef,
    setRailScrollRoot,
  } = useInfographicImages({ notebookId, orgSlug });
  const clearStudioTool = useSidebarState((s) => s.clearStudioTool);
  const [prompt, setPrompt] = useState("");
  const workspace = useInfographicWorkspace({
    images,
    imagesLoading: isImagesLoading,
    chatLoading: isLoading,
    labels,
    sendMessage,
    prompt,
    setPrompt,
  });

  const handleExit = () => {
    clearStudioTool();
    onExit?.();
  };

  const showImageWorkspace =
    workspace.previewState !== null || images.length > 0 || isImagesLoading;

  return (
    <InfographicViewContent
      t={t}
      isLoading={isLoading}
      imagesController={{
        images,
        isLoading: isImagesLoading,
        isFetchingNextPage,
        loadMoreRef,
        setRailScrollRoot,
      }}
      commentsController={workspace.comments}
      activeImageId={workspace.selection.activeImageId}
      selectedImage={workspace.selectedImage}
      previewState={workspace.previewState}
      showImageWorkspace={showImageWorkspace}
      prompt={prompt}
      currentAspectRatio={workspace.selectedImage?.output?.aspectRatio}
      onExit={handleExit}
      onToggleCommentMode={() =>
        workspace.comments.setCommentMode((current) => !current)
      }
      onAspectRatioSelect={workspace.actions.selectAspectRatio}
      onSelectImage={(imageId) => {
        workspace.selection.selectImage(imageId);
        workspace.comments.setActiveCommentId(null);
      }}
      onPromptChange={setPrompt}
      onSubmit={workspace.actions.submit}
    />
  );
}
