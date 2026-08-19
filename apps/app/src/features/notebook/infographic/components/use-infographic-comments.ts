"use client";

import type { NotebookTranslations } from "../../i18n/notebook.types";
import type { InfographicImageComment } from "./infographic-comments";
import type { InfographicImage } from "./merge-infographic-images";

import { useState } from "react";

import { toImageEditRegions } from "@/features/notebook/media/tools/image-schemas";

import {
  buildInfographicCommentsPrompt,
  createInfographicComment,
} from "./infographic-comments";
import { sendImageEdit } from "./send-image-edit";

interface UseInfographicCommentsParams {
  activeImageId: string | null;
  previewReady: boolean;
  isLoading: boolean;
  labels: NotebookTranslations["studio"]["imageEditor"];
  sendMessage: Parameters<typeof sendImageEdit>[0]["sendMessage"];
  selectedImage: InfographicImage | null;
  onBeforeSendEdit?: () => void;
}

function useCommentStorage(activeImageId: string | null) {
  const [commentsByImage, setCommentsByImage] = useState<
    Record<string, InfographicImageComment[]>
  >({});
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentMode, setCommentMode] = useState(false);
  const [notesByImage, setNotesByImage] = useState<Record<string, string>>({});
  const comments = activeImageId ? (commentsByImage[activeImageId] ?? []) : [];
  const additionalNotes = activeImageId
    ? (notesByImage[activeImageId] ?? "")
    : "";
  const update = (
    updater: (comments: InfographicImageComment[]) => InfographicImageComment[],
  ) => {
    if (activeImageId)
      setCommentsByImage((current) => ({
        ...current,
        [activeImageId]: updater(current[activeImageId] ?? []),
      }));
  };
  const clear = () => {
    if (!activeImageId) return;
    setCommentsByImage((current) => {
      const next = { ...current };
      delete next[activeImageId];
      return next;
    });
    setNotesByImage((current) => {
      const next = { ...current };
      delete next[activeImageId];
      return next;
    });
    setActiveCommentId(null);
  };
  const changeNotes = (value: string) => {
    if (activeImageId)
      setNotesByImage((current) => ({ ...current, [activeImageId]: value }));
  };
  return {
    comments,
    additionalNotes,
    activeCommentId,
    setActiveCommentId,
    commentMode,
    setCommentMode,
    update,
    clear,
    changeNotes,
  };
}

function useCommentCrud(
  storage: ReturnType<typeof useCommentStorage>,
  previewReady: boolean,
  isLoading: boolean,
) {
  const add = (x: number, y: number, radius: number) => {
    if (!previewReady || isLoading) return;
    const comment = createInfographicComment(x, y, radius);
    storage.update((current) => [
      ...current.filter((item) => item.text.trim()),
      comment,
    ]);
    storage.setActiveCommentId(comment.id);
  };
  const update = (id: string, text: string) =>
    storage.update((current) =>
      current.map((comment) =>
        comment.id === id ? { ...comment, text } : comment,
      ),
    );
  const submit = (id: string) => {
    if (storage.comments.find((comment) => comment.id === id)?.text.trim())
      storage.setActiveCommentId(null);
  };
  const remove = (id: string) => {
    storage.update((current) => current.filter((comment) => comment.id !== id));
    storage.setActiveCommentId((current) => (current === id ? null : current));
  };
  const dismiss = (id: string) => {
    const comment = storage.comments.find((item) => item.id === id);
    storage.update((current) =>
      comment?.text.trim() ? current : current.filter((item) => item.id !== id),
    );
    storage.setActiveCommentId((current) => (current === id ? null : current));
  };
  return { add, update, submit, remove, dismiss };
}

export function useInfographicComments({
  activeImageId,
  previewReady,
  isLoading,
  labels,
  sendMessage,
  selectedImage,
  onBeforeSendEdit,
}: UseInfographicCommentsParams) {
  const storage = useCommentStorage(activeImageId);
  const crud = useCommentCrud(storage, previewReady, isLoading);
  const {
    comments,
    additionalNotes,
    activeCommentId,
    setActiveCommentId,
    commentMode,
    setCommentMode,
  } = storage;
  const visibleActiveCommentId =
    activeCommentId &&
    comments.some((comment) => comment.id === activeCommentId)
      ? activeCommentId
      : null;

  const handleSendComments = () => {
    if (isLoading) return;

    const sourceImageId = selectedImage?.output?.imageId;
    if (!sourceImageId) return;

    const filledComments = comments.filter((comment) => comment.text.trim());
    const notes = additionalNotes.trim();
    if (filledComments.length === 0 && !notes) return;

    const regions = toImageEditRegions(filledComments);
    const userText = buildInfographicCommentsPrompt({
      comments,
      additionalNotes: notes || undefined,
      intro: labels.comments.promptIntro,
      itemTemplate: labels.comments.promptItem,
      additionalTemplate: labels.comments.promptAdditional,
    });

    if (!userText) return;

    onBeforeSendEdit?.();

    void Promise.resolve(
      sendImageEdit({
        sendMessage,
        sourceImageId,
        alt: selectedImage.output?.alt ?? selectedImage.alt ?? "",
        prompt: notes || undefined,
        regions: regions.length > 0 ? regions : undefined,
        userText,
      }),
    ).then(() => {
      storage.clear();
    });
  };

  return {
    comments,
    additionalNotes,
    visibleActiveCommentId,
    commentMode,
    setCommentMode,
    setActiveCommentId,
    handleAddComment: crud.add,
    handleUpdateComment: crud.update,
    handleSubmitComment: crud.submit,
    handleDeleteComment: crud.remove,
    handleDismissComment: crud.dismiss,
    handleClearComments: storage.clear,
    handleSendComments,
    handleAdditionalNotesChange: storage.changeNotes,
  };
}
