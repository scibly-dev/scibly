"use client";

import { routes } from "@scibly/routes";
import { Button } from "@scibly/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@scibly/ui/components/dialog";
import { Upload } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { type CoursesTranslations } from "@/features/course-authoring/contracts";
import { type GateDecision } from "@/features/organizations/contracts";
import { useTranslation } from "@/i18n/hooks/use-translation";
import { api } from "@/shared/api/trpc/client";
import { FeatureGateNotice } from "@/shared/ui/feature-gate-notice";

import { invalidateCourseAdmin } from "../utils";
import { CourseCoverControl } from "./course-cover-control";
import { CourseEditSheet } from "./course-edit-sheet";
import { CourseHeroActions } from "./course-hero-actions";
import { CourseHeroBanner } from "./course-hero-banner";
import { CourseShareDialog } from "./course-share-dialog";

interface CourseAdminHeroProps {
  courseId: string;
  orgSlug: string;
}

// The confirm action is gone rather than disabled, since the gate would only refuse it again.
export function PublishGateNotice({
  gate,
  orgSlug,
  t,
}: {
  gate: GateDecision;
  orgSlug: string;
  t: CoursesTranslations;
}) {
  const copy = t.detail.publishDialog;
  const plan = gate.requiredPlan ?? copy.gateFallbackPlan;
  const lapsed = gate.reason === "lapsed";

  return (
    <>
      <FeatureGateNotice
        title={
          lapsed
            ? copy.gateLapsedTitle
            : copy.gateTitle.replaceAll("{{plan}}", plan)
        }
        description={
          lapsed
            ? copy.gateLapsedDescription
            : copy.gateDescription.replaceAll("{{plan}}", plan)
        }
      />
      <DialogFooter className="mt-4">
        <Button asChild>
          <Link href={routes.app.profile.org(orgSlug).billing}>
            {copy.gateViewPlans}
          </Link>
        </Button>
      </DialogFooter>
    </>
  );
}

export function PublishDialogActions({
  blockedReason,
  onClose,
  onPublish,
  pending,
  t,
}: {
  blockedReason: string | null;
  onClose: () => void;
  onPublish: () => void;
  pending: boolean;
  t: CoursesTranslations;
}) {
  return (
    <DialogFooter className="mt-4">
      <Button variant="outline" onClick={onClose} disabled={pending}>
        {t.detail.publishDialog.cancel}
      </Button>
      <Button
        onClick={onPublish}
        disabled={pending}
        className="gap-2"
        variant={blockedReason ? "destructive" : "default"}
      >
        {pending ? (
          t.detail.publishDialog.publishing
        ) : (
          <>
            <Upload className="h-4 w-4" />
            {blockedReason
              ? t.detail.publishDialog.confirmForce
              : t.detail.publishDialog.confirmPublish}
          </>
        )}
      </Button>
    </DialogFooter>
  );
}

export function PublishCourseDialog({
  blockedReason,
  gate,
  supersedePrevious,
  onClose,
  onSupersedeChange,
  onOpenChange,
  onPublish,
  open,
  orgSlug,
  pending,
  t,
}: {
  blockedReason: string | null;

  gate: GateDecision | null;
  supersedePrevious: boolean;
  onClose: () => void;
  onSupersedeChange: (checked: boolean) => void;
  onOpenChange: (open: boolean) => void;
  onPublish: () => void;
  open: boolean;
  orgSlug: string;
  pending: boolean;
  t: CoursesTranslations;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.detail.publishDialog.title}</DialogTitle>
          <DialogDescription>
            {gate
              ? t.detail.publishDialog.gateDialogDescription
              : t.detail.publishDialog.description}
          </DialogDescription>
        </DialogHeader>
        {gate ? (
          <PublishGateNotice gate={gate} orgSlug={orgSlug} t={t} />
        ) : (
          <PublishCourseDialogBody
            blockedReason={blockedReason}
            supersedePrevious={supersedePrevious}
            onClose={onClose}
            onSupersedeChange={onSupersedeChange}
            onPublish={onPublish}
            pending={pending}
            t={t}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

export function PublishCourseDialogBody({
  blockedReason,
  supersedePrevious,
  onClose,
  onSupersedeChange,
  onPublish,
  pending,
  t,
}: {
  blockedReason: string | null;
  supersedePrevious: boolean;
  onClose: () => void;
  onSupersedeChange: (checked: boolean) => void;
  onPublish: () => void;
  pending: boolean;
  t: CoursesTranslations;
}) {
  return (
    <>
      <div className="flex items-start gap-3 py-2">
        <input
          id="invalidate-toggle"
          type="checkbox"
          checked={supersedePrevious}
          onChange={(event) => onSupersedeChange(event.target.checked)}
          className="border-hairline mt-0.5 h-4 w-4 rounded border-2 text-[#e5484d] focus:ring-[#e5484d]"
        />
        <div>
          <label
            htmlFor="invalidate-toggle"
            className="text-ink cursor-pointer text-sm font-semibold"
          >
            {t.detail.publishDialog.supersedeLabel}
          </label>
          <p className="text-ink-soft mt-0.5 text-xs">
            {t.detail.publishDialog.supersedeDescription}
          </p>
        </div>
      </div>
      {blockedReason ? (
        <FeatureGateNotice>{blockedReason}</FeatureGateNotice>
      ) : null}
      <PublishDialogActions
        blockedReason={blockedReason}
        onClose={onClose}
        onPublish={onPublish}
        pending={pending}
        t={t}
      />
    </>
  );
}

export function CourseAdminHero({ courseId, orgSlug }: CourseAdminHeroProps) {
  const { translations: t } = useTranslation("courses");
  const { data: course } = api.course.getById.useQuery({ courseId });
  const { data: access } = api.billing.getFeatureAccess.useQuery({ orgSlug });
  const utils = api.useUtils();
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [supersedePrevious, setSupersedePrevious] = useState(false);
  const [publishBlockedReason, setPublishBlockedReason] = useState<
    string | null
  >(null);
  const publishMutation = api.course.publishCourse.useMutation({
    onSuccess: ({ version }) => {
      toast.success(
        t.detail.toastPublishSuccess.replace("{{version}}", String(version)),
      );
      setShowPublishDialog(false);
      setSupersedePrevious(false);
      setPublishBlockedReason(null);
      invalidateCourseAdmin(utils, courseId);
    },
    onError: (error) => {
      if (error.message.startsWith("Cannot publish:")) {
        setPublishBlockedReason(error.message);
        return;
      }
      toast.error(error.message || t.detail.toastPublishFailed);
    },
  });

  const publishGate = access?.publish.allowed === false ? access.publish : null;

  if (!course) return null;

  const totalLessons = course._count?.lessons || 0;

  const currentDraftVersion = (course.versions?.[0]?.version ?? 0) + 1;

  return (
    <div className="relative">
      <CourseHeroBanner
        course={course}
        totalLessons={totalLessons}
        totalTimeMinutes={course.totalEstimatedTimeMinutes}
        draftVersion={currentDraftVersion}
        latestPublishedVersion={course.versions?.[0] ?? null}
        t={t}
      />

      <CourseHeroActions
        courseId={courseId}
        orgSlug={orgSlug}
        onPublish={() => setShowPublishDialog(true)}
        onShare={() => setShowShareDialog(true)}
        pending={publishMutation.isPending}
        t={t}
      />

      <div className="absolute right-6 bottom-6 z-30 flex items-center gap-2 lg:right-8 lg:bottom-8">
        <CourseCoverControl
          courseId={courseId}
          thumbnail={course.thumbnail}
          t={t}
        />
        <CourseEditSheet
          course={course}
          lessonCount={totalLessons}
          orgSlug={orgSlug}
        />
      </div>

      <CourseShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        course={course}
        allowAnonymous={course.allowAnonymous}
        t={t}
      />

      <PublishCourseDialog
        open={showPublishDialog}
        onOpenChange={(open) => {
          setShowPublishDialog(open);
          if (!open) setPublishBlockedReason(null);
        }}
        blockedReason={publishBlockedReason}
        gate={publishGate}
        orgSlug={orgSlug}
        supersedePrevious={supersedePrevious}
        onClose={() => setShowPublishDialog(false)}
        onSupersedeChange={setSupersedePrevious}
        onPublish={() =>
          publishMutation.mutate({
            courseId,
            supersedePrevious,
            force: Boolean(publishBlockedReason),
          })
        }
        pending={publishMutation.isPending}
        t={t}
      />
    </div>
  );
}
