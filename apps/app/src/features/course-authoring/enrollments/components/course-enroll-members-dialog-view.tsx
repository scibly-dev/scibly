import { getInitials } from "@scibly/lib";
import { routes } from "@scibly/routes";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@scibly/ui/components/avatar";
import { Button } from "@scibly/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@scibly/ui/components/dialog";
import { Input } from "@scibly/ui/components/input";
import { cn } from "@scibly/ui/utils";
import { Check, Loader2, Search } from "lucide-react";
import Link from "next/link";

import { type CoursesTranslations } from "@/features/course-authoring/contracts";
import { type GateDecision } from "@/features/organizations/contracts";
import { type RouterOutputs } from "@/shared/api/trpc/contracts";
import { FeatureGateNotice } from "@/shared/ui/feature-gate-notice";

type AvailableMember =
  RouterOutputs["course"]["getAvailableMembers"]["items"][number];

export function AvailableMemberRow({
  member,
  onToggle,
  selected,
}: {
  member: AvailableMember;
  onToggle: (userId: string) => void;
  selected: boolean;
}) {
  return (
    <button
      onClick={() => onToggle(member.id)}
      className={cn(
        "flex items-center gap-3 rounded-xl border-2 p-2 text-left transition-colors",
        selected
          ? "border-[#b9d7ff] bg-[#f2f7ff]"
          : "border-transparent hover:bg-[#f7f9fd]",
      )}
    >
      <Avatar className="h-8 w-8">
        <AvatarImage src={member.image ?? ""} />
        <AvatarFallback className="text-[10px]">
          {member.name
            ? getInitials(member.name)[0]
            : member.email[0].toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="text-ink truncate text-sm font-semibold">
          {member.name || member.email}
        </div>
        {member.name ? (
          <div className="text-ink-soft truncate text-xs">{member.email}</div>
        ) : null}
      </div>
      <div
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          selected
            ? "border-[#0066FF] bg-[#0066FF] text-white"
            : "border-hairline",
        )}
      >
        {selected ? <Check className="h-3.5 w-3.5" /> : null}
      </div>
    </button>
  );
}

export function AvailableMembersList({
  hasNextPage,
  loading,
  members,
  onToggle,
  sentinelRef,
  selectedIds,
  t,
}: {
  hasNextPage: boolean;
  loading: boolean;
  members: AvailableMember[];
  onToggle: (userId: string) => void;
  sentinelRef: (node?: Element | null) => void;
  selectedIds: Set<string>;
  t: CoursesTranslations;
}) {
  if (loading)
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="text-ink-soft h-5 w-5 animate-spin" />
      </div>
    );
  if (members.length === 0)
    return (
      <div className="text-ink-soft p-4 text-center text-sm">
        {t.detail.enrollDialog.noMembers}
      </div>
    );
  return (
    <>
      {members.map((member) => (
        <AvailableMemberRow
          key={member.id}
          member={member}
          onToggle={onToggle}
          selected={selectedIds.has(member.id)}
        />
      ))}
      {hasNextPage ? (
        <div ref={sentinelRef} className="flex justify-center pt-2 pb-1">
          <Loader2 className="text-ink-soft h-4 w-4 animate-spin" />
        </div>
      ) : null}
    </>
  );
}

// A plan with no learner seats can't be fixed by selecting fewer people, so this offers a plan upgrade rather than a shortfall count.
export function EnrollSeatGateNotice({
  gate,
  orgSlug,
  t,
}: {
  gate: GateDecision;
  orgSlug: string;
  t: CoursesTranslations;
}) {
  const enrollT = t.detail.enrollDialog;
  const lapsed = gate.reason === "lapsed";
  return (
    <FeatureGateNotice
      title={
        lapsed
          ? enrollT.seatGateLapsedTitle
          : enrollT.seatGateTitle.replaceAll(
              "{{plan}}",
              gate.requiredPlan ?? enrollT.seatGateFallbackPlan,
            )
      }
      description={
        lapsed ? enrollT.seatGateLapsedDescription : enrollT.seatGateDescription
      }
    >
      <Link
        href={routes.app.profile.org(orgSlug).billing}
        className="mt-1 inline-block font-medium underline"
      >
        {enrollT.seatGateViewPlans}
      </Link>
    </FeatureGateNotice>
  );
}

// The seat cap's refusal, shown beside the people it refused; the count is the server's own and pre-fills the seats card as a quantity to confirm.
export function EnrollSeatShortfallNotice({
  shortfall,
  orgSlug,
  t,
}: {
  shortfall: number;
  orgSlug: string;
  t: CoursesTranslations;
}) {
  const enrollT = t.detail.enrollDialog;
  const count = String(shortfall);
  return (
    <FeatureGateNotice
      title={enrollT.seatShortfallTitle.replaceAll("{{count}}", count)}
      description={enrollT.seatShortfallDescription.replaceAll(
        "{{count}}",
        count,
      )}
    >
      <Link
        href={routes.app.profile.org(orgSlug).buySeats(shortfall)}
        className="mt-1 inline-block font-medium underline"
      >
        {enrollT.seatShortfallLink.replaceAll("{{count}}", count)}
      </Link>
    </FeatureGateNotice>
  );
}

export function EnrollDialogActions({
  count,
  locked,
  onCancel,
  onEnroll,
  pending,
  t,
}: {
  count: number;

  locked: boolean;
  onCancel: () => void;
  onEnroll: () => void;
  pending: boolean;
  t: CoursesTranslations;
}) {
  const enrollT = t.detail.enrollDialog;
  return (
    <div className="border-hairline flex justify-end gap-2 border-t-2 pt-4">
      <Button type="button" variant="outline" onClick={onCancel}>
        {enrollT.cancel}
      </Button>
      <Button
        type="button"
        disabled={locked || count === 0 || pending}
        onClick={onEnroll}
      >
        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {count > 0
          ? enrollT.enrollBtnCount.replace("{{count}}", String(count))
          : enrollT.enrollBtn}
      </Button>
    </div>
  );
}

export function EnrollmentInputs({
  dueDate,
  onDueDateChange,
  onSearchChange,
  search,
  t,
}: {
  dueDate: string;
  onDueDateChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  search: string;
  t: CoursesTranslations;
}) {
  const enrollT = t.detail.enrollDialog;
  return (
    <>
      <div className="relative">
        <Search className="text-ink-faint absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder={enrollT.searchPlaceholder}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-10 pl-9"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-ink-soft text-[12px] font-medium">
          {enrollT.dueDate}
        </label>
        <Input
          type="date"
          value={dueDate}
          onChange={(event) => onDueDateChange(event.target.value)}
          min={new Date().toISOString().split("T")[0]}
          className="h-9"
        />
      </div>
    </>
  );
}

interface EnrollMembersDialogViewProps {
  dueDate: string;
  hasNextPage: boolean;
  loading: boolean;
  members: AvailableMember[];
  onDueDateChange: (value: string) => void;
  onEnroll: () => void;
  onOpenChange: (open: boolean) => void;
  onSearchChange: (value: string) => void;
  onToggle: (userId: string) => void;
  open: boolean;
  orgSlug: string;
  pending: boolean;
  search: string;

  seatGate: GateDecision | null;

  seatShortfall: number | null;
  selectedIds: Set<string>;
  sentinelRef: (node?: Element | null) => void;
  t: CoursesTranslations;
}

export function EnrollMembersDialogView(props: EnrollMembersDialogViewProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{props.t.detail.enrollDialog.title}</DialogTitle>
          <DialogDescription>
            {props.t.detail.enrollDialog.desc}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 flex flex-col gap-4">
          {props.seatGate ? (
            <EnrollSeatGateNotice
              gate={props.seatGate}
              orgSlug={props.orgSlug}
              t={props.t}
            />
          ) : null}
          {props.seatShortfall !== null ? (
            <EnrollSeatShortfallNotice
              shortfall={props.seatShortfall}
              orgSlug={props.orgSlug}
              t={props.t}
            />
          ) : null}
          <EnrollmentInputs
            dueDate={props.dueDate}
            onDueDateChange={props.onDueDateChange}
            onSearchChange={props.onSearchChange}
            search={props.search}
            t={props.t}
          />
          <div className="flex h-[50vh] min-h-[300px] flex-col gap-2 overflow-y-auto pr-2">
            <AvailableMembersList
              hasNextPage={props.hasNextPage}
              loading={props.loading}
              members={props.members}
              onToggle={props.onToggle}
              sentinelRef={props.sentinelRef}
              selectedIds={props.selectedIds}
              t={props.t}
            />
          </div>
          <EnrollDialogActions
            count={props.selectedIds.size}
            locked={props.seatGate !== null}
            onCancel={() => props.onOpenChange(false)}
            onEnroll={props.onEnroll}
            pending={props.pending}
            t={props.t}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
