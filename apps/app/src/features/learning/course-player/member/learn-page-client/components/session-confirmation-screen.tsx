"use client";

import { routes } from "@scibly/routes";
import { RefreshCw, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useTranslation } from "@/i18n/hooks/use-translation";
import { api } from "@/shared/api/trpc/client";

interface SessionConfirmationScreenProps {
  mode: "retry" | "version-update";
  orgSlug: string;
  courseId: string;
  courseTitle: string;
}

export function SessionConfirmationScreen({
  mode,
  orgSlug,
  courseId,
  courseTitle,
}: SessionConfirmationScreenProps) {
  const { translations } = useTranslation("learn");
  const t =
    mode === "retry"
      ? translations.playerStates.retryConfirm
      : translations.playerStates.versionUpdateConfirm;
  const router = useRouter();

  const retryMutation = api.learning.confirmRetryAttempt.useMutation();
  const versionUpdateMutation = api.learning.confirmVersionUpdate.useMutation();
  const isPending = retryMutation.isPending || versionUpdateMutation.isPending;

  const handleConfirm = () => {
    const mutation = mode === "retry" ? retryMutation : versionUpdateMutation;
    mutation.mutate({ courseId }, { onSuccess: () => router.refresh() });
  };

  const IconComponent = mode === "retry" ? RotateCcw : RefreshCw;

  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
        <IconComponent className="h-7 w-7 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="grid gap-2">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {t.title}
        </h2>
        <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          {t.description.replace("{{courseTitle}}", courseTitle)}
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href={routes.app.profile.org(orgSlug).dashboard}
          className="rounded-xl border border-neutral-200 bg-white px-6 py-2.5 text-[13px] font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          {t.backToDashboard}
        </Link>
        <button
          onClick={handleConfirm}
          disabled={isPending}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6 py-2.5 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? t.confirmCtaPending : t.confirmCta}
        </button>
      </div>
    </div>
  );
}
