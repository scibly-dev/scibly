"use client";

import type { NotebookTranslations } from "../../../i18n/notebook.types";
import type {
  DeletionDisplayStatus,
  DeletionInvocation,
} from "./deletion.types";

import { Button } from "@scibly/ui/components/button";
import { ExternalLink, Trash2 } from "lucide-react";
import { useState } from "react";

import { api } from "@/shared/api/trpc/client";

import {
  DestructiveApprovalCardShell,
  InlineToolStatusBanner,
} from "../components/inline-tool-card-parts";
import { deletionLabel } from "./deletion-label";
import { openDeletionInCourseBuilder } from "./open-deletion-in-builder";
import { useDeletionApproval } from "./use-deletion-approval";
import { useDeletionNavigationContext } from "./use-deletion-navigation-context";

interface DeletionConfirmationCardProps {
  invocation: DeletionInvocation;
  t: NotebookTranslations;
}

const DeletionItems = ({
  invocation,
  cb,
  openCourseButton,
  showOpenCourse,
}: {
  invocation: DeletionInvocation;
  cb: NotebookTranslations["studio"]["courseBuilder"];
  openCourseButton: React.ReactNode;
  showOpenCourse: boolean;
}) => {
  const isScene = invocation.kind === "scene";
  return (
    <div className="space-y-2 p-3">
      {invocation.items.map((item) => (
        <div
          key={item.id}
          className="rounded-lg border border-red-200/80 bg-white p-3 dark:border-red-900/40 dark:bg-neutral-950"
        >
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {item.title ??
              (isScene ? cb.deletionFallbackScene : cb.deletionFallbackLesson)}
          </p>
          {item.subtitle ? (
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              {item.subtitle}
            </p>
          ) : null}
        </div>
      ))}
      {invocation.reason ? (
        <p className="px-0.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
          {invocation.reason}
        </p>
      ) : null}
      {showOpenCourse ? (
        <div className="rounded-lg border border-neutral-200/80 bg-white/80 px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-950/60">
          <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
            {cb.deletionCourseNotOpenHint}
          </p>
          <div className="mt-2">{openCourseButton}</div>
        </div>
      ) : null}
    </div>
  );
};

/**
 * The two things the tool part cannot know: the mutation this browser has in
 * flight, and an error the tool call has not been told about yet.
 */
function displayStatus(
  invocation: DeletionInvocation,
  isResponding: boolean,
  localError: string | null,
): DeletionDisplayStatus {
  if (invocation.status === "deleted") return "deleted";
  if (localError) return "failed";
  if (invocation.status === "awaiting-approval" && isResponding)
    return "deleting";
  return invocation.status;
}

function deletionStatusBanner({
  status,
  invocation,
  cb,
  localError,
  completedLabel,
  openCourseButton,
}: {
  status: DeletionDisplayStatus;
  invocation: DeletionInvocation;
  cb: NotebookTranslations["studio"]["courseBuilder"];
  localError: string | null;
  completedLabel: string;
  openCourseButton: React.ReactNode;
}) {
  switch (status) {
    case "deleted":
      return (
        <InlineToolStatusBanner variant="completed" title={completedLabel} />
      );
    case "failed":
      return (
        <InlineToolStatusBanner
          variant="error"
          title={cb.deletionFailed}
          detail={localError ?? invocation.errorText}
          action={openCourseButton}
        />
      );
    case "denied":
      return (
        <InlineToolStatusBanner variant="denied" title={cb.deletionCancelled} />
      );
    case "deleting":
      return (
        <InlineToolStatusBanner
          variant="loading"
          title={cb.deletionProcessing}
        />
      );

    case "streaming":
    case "awaiting-approval":
      return null;
  }
}

const DeletionApprovalCard = ({
  invocation,
  cb,
  title,
  description,
  openCourseButton,
  showOpenCourse,
  canRespond,
  onDeny,
  onApprove,
}: {
  invocation: DeletionInvocation;
  cb: NotebookTranslations["studio"]["courseBuilder"];
  title: string;
  description: string;
  openCourseButton: React.ReactNode;
  showOpenCourse: boolean;
  canRespond: boolean;
  onDeny: () => void;
  onApprove: () => void;
}) => {
  return (
    <DestructiveApprovalCardShell>
      <div className="border-b border-red-200/60 px-3 py-2.5 dark:border-red-900/30">
        <p className="text-sm font-semibold text-red-950 dark:text-red-100">
          {title}
        </p>
        <p className="mt-0.5 text-xs text-red-900/80 dark:text-red-200/80">
          {description}
        </p>
      </div>
      <DeletionItems
        invocation={invocation}
        cb={cb}
        openCourseButton={openCourseButton}
        showOpenCourse={showOpenCourse}
      />
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-red-200/60 px-3 py-2.5 dark:border-red-900/30">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          disabled={!canRespond}
          onClick={onDeny}
        >
          {cb.cancel}
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="h-8 text-xs"
          disabled={!canRespond}
          onClick={onApprove}
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          {invocation.items.length > 1 ? cb.confirmDeleteAll : cb.confirmDelete}
        </Button>
      </div>
    </DestructiveApprovalCardShell>
  );
};

function useOpenCourseButton(invocation: DeletionInvocation, label: string) {
  const utils = api.useUtils();
  const [isOpening, setIsOpening] = useState(false);
  const navigation = useDeletionNavigationContext(invocation);
  const show =
    Boolean(navigation.courseId) && !navigation.isCourseOpenInBuilder;
  const open = async () => {
    if (!navigation.courseId) return;
    setIsOpening(true);
    try {
      await openDeletionInCourseBuilder(utils, {
        courseId: navigation.courseId,
        courseTitle: navigation.courseTitle,
        focusLesson: navigation.focusLesson,
      });
    } finally {
      setIsOpening(false);
    }
  };
  return {
    show,
    button: show ? (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 text-xs"
        disabled={isOpening || navigation.isNavigationLoading}
        onClick={() => void open()}
      >
        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
        {label}
      </Button>
    ) : null,
  };
}

export function DeletionConfirmationCard({
  invocation,
  t,
}: DeletionConfirmationCardProps) {
  const cb = t.studio.courseBuilder;
  const openCourse = useOpenCourseButton(
    invocation,
    cb.deletionOpenCourseBuilder,
  );
  const { canRespond, handleApprove, handleDeny, isResponding, localError } =
    useDeletionApproval({
      invocation,
      cb,
    });

  const { kind, items } = invocation;
  const isScene = kind === "scene";
  const count = items.length;
  const isBatch = count > 1;

  const status = displayStatus(invocation, isResponding, localError);
  const banner = deletionStatusBanner({
    status,
    invocation,
    cb,
    localError,
    completedLabel: deletionLabel(isScene, isBatch, count, cb, true),
    openCourseButton: openCourse.button,
  });
  if (banner) return banner;

  if (status !== "awaiting-approval" || !invocation.approval) return null;

  const title = deletionLabel(isScene, isBatch, count, cb, false);

  const description = isScene
    ? cb.deletionConfirmSceneDescription
    : cb.deletionConfirmLessonDescription;

  return (
    <DeletionApprovalCard
      invocation={invocation}
      cb={cb}
      title={title}
      description={description}
      openCourseButton={openCourse.button}
      showOpenCourse={openCourse.show}
      canRespond={canRespond}
      onDeny={handleDeny}
      onApprove={handleApprove}
    />
  );
}
