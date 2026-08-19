"use client";

import type { LearningPlayerTranslations } from "../../i18n/learning-player.types";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@scibly/ui/components/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@scibly/ui/components/sheet";
import { useSyncExternalStore } from "react";

import { ExitModalBody } from "../../components/exit-modal-body";

const MD_MEDIA_QUERY = "(min-width: 768px)";

function subscribeMdMediaQuery(onChange: () => void) {
  const mediaQuery = window.matchMedia(MD_MEDIA_QUERY);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

function getMdMediaQuerySnapshot() {
  return window.matchMedia(MD_MEDIA_QUERY).matches;
}

function getExitModalDescription(
  exitModal: LearningPlayerTranslations["exitModal"],
  scenesCompleted: number,
  scenesTotal: number,
): string {
  const remaining = Math.max(0, scenesTotal - scenesCompleted);

  if (remaining <= 1 && scenesTotal > 0) {
    return exitModal.descriptionAlmostDone;
  }

  if (scenesCompleted > 0 && remaining > 1) {
    return exitModal.descriptionRemaining.replace(
      "{{remaining}}",
      String(remaining),
    );
  }

  return exitModal.descriptionEarly;
}

interface PlayerExitModalProps {
  show: boolean;
  onStay: () => void;
  onExit: () => void;
  t: LearningPlayerTranslations;
  scenesCompleted: number;
  scenesTotal: number;
}

export function PlayerExitModal({
  show,
  onStay,
  onExit,
  t,
  scenesCompleted,
  scenesTotal,
}: PlayerExitModalProps) {
  const isDesktop = useSyncExternalStore(
    subscribeMdMediaQuery,
    getMdMediaQuerySnapshot,
    () => false,
  );

  const description = getExitModalDescription(
    t.exitModal,
    scenesCompleted,
    scenesTotal,
  );

  const handleOpenChange = (open: boolean) => {
    if (!open) onStay();
  };

  const body = (
    <ExitModalBody
      title={t.exitModal.title}
      description={description}
      stayLabel={t.exitModal.stay}
      exitLabel={t.exitModal.exit}
      onStay={onStay}
      onExit={onExit}
      layout={isDesktop ? "dialog" : "sheet"}
    />
  );

  if (isDesktop) {
    return (
      <Dialog open={show} onOpenChange={handleOpenChange}>
        <DialogContent
          renderCloseButton={false}
          overlayClassName="z-[200] bg-black/35 backdrop-blur-[2px]"
          className="z-[200] max-w-md gap-0 border-0 bg-white p-6 shadow-2xl sm:rounded-3xl"
        >
          <DialogTitle className="sr-only">{t.exitModal.title}</DialogTitle>
          <DialogDescription className="sr-only">
            {description}
          </DialogDescription>
          {body}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={show} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        overlayClassName="z-[200] bg-black/35 backdrop-blur-[2px]"
        className="z-[200] gap-0 rounded-t-[28px] border-0 bg-white p-0 pt-4 shadow-[0_-10px_48px_rgba(0,0,0,0.14)] [&>button]:hidden"
      >
        <SheetTitle className="sr-only">{t.exitModal.title}</SheetTitle>
        <SheetDescription className="sr-only">{description}</SheetDescription>
        {body}
      </SheetContent>
    </Sheet>
  );
}
