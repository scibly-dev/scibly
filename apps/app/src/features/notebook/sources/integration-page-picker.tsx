"use client";

import type { PagePickerContentProps } from "./page-picker/page-picker-content";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@scibly/ui/components/dialog";

import { PagePickerContent } from "./page-picker/page-picker-content";
import { PROVIDER_DISPLAY } from "./provider-display";

export function IntegrationPagePicker({
  open,
  ...content
}: PagePickerContentProps & { open: boolean }) {
  const meta = PROVIDER_DISPLAY[content.provider];

  return (
    <Dialog open={open} onOpenChange={content.onOpenChange}>
      <DialogContent className="flex h-[580px] w-full max-w-2xl flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <meta.Logo className="h-8 w-8 shrink-0 text-neutral-900 dark:text-neutral-100" />
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-[14px] leading-tight font-semibold text-neutral-900 dark:text-neutral-100">
                {meta.name}
              </DialogTitle>
              <p className="mt-0.5 text-[11px] text-neutral-400">
                {meta.subtitle}
              </p>
            </div>
          </div>
        </DialogHeader>

        <PagePickerContent key={String(open)} {...content} />
      </DialogContent>
    </Dialog>
  );
}
