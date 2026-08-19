"use client";

import type { Member } from "@scibly/db";
import type { DictionaryPages } from "@/i18n/types";

import { Button } from "@scibly/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@scibly/ui/components/dialog";
import { Input } from "@scibly/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@scibly/ui/components/select";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { api } from "@/shared/api/trpc/client";

type Invite = { email: string; role: Member["role"] };
type MembersTranslations = DictionaryPages["orgMembers"];

function useInviteMembersMutation(
  t: MembersTranslations,
  onOpenChange: (open: boolean) => void,
  setInvites: React.Dispatch<React.SetStateAction<Invite[]>>,
) {
  const trpcUtils = api.useUtils();
  return api.organization.inviteMembers.useMutation({
    onSuccess: (results, variables) => {
      const errors = results.filter((result) => result.error);
      const successes = results.filter((result) => !result.error);
      if (successes.length > 0) {
        void trpcUtils.organization.listMembersAndInvitations.invalidate({
          organizationId: variables.organizationId,
        });
      }
      if (errors.length === 0) {
        toast.success(t.inviteModal.success);
        onOpenChange(false);
        setInvites([{ email: "", role: "member" }]);
        return;
      }
      const messages = Array.from(
        new Set(errors.map((error) => error.error).filter(Boolean)),
      );
      const detail = messages.length > 0 ? `: ${messages.join(", ")}` : "";
      toast.error(
        `${t.inviteModal.failedToInvite.replace("{{count}}", String(errors.length))}${detail}`,
      );
      setInvites(
        variables.invites.flatMap((invite, index) =>
          results[index].error
            ? [{ email: invite.email, role: invite.role }]
            : [],
        ),
      );
    },
    onError: (error) => toast.error(error.message),
  });
}

export const InviteRows = ({
  invites,
  setInvites,
  t,
}: {
  invites: Invite[];
  setInvites: React.Dispatch<React.SetStateAction<Invite[]>>;
  t: MembersTranslations;
}) => (
  <div className="flex flex-col gap-3">
    <label className="text-sm font-medium">{t.inviteModal.email}</label>
    {invites.map((invite, index) => (
      <div key={index} className="flex items-center gap-2">
        <Input
          placeholder={t.inviteModal.emailPlaceholder}
          value={invite.email}
          onChange={(event) =>
            setInvites((current) =>
              current.map((item, itemIndex) =>
                itemIndex === index
                  ? { ...item, email: event.target.value }
                  : item,
              ),
            )
          }
          autoFocus={index === 0}
          className="flex-1"
        />
        <div className="w-[120px]">
          <Select
            value={invite.role}
            onValueChange={(role: Member["role"]) =>
              setInvites((current) =>
                current.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, role } : item,
                ),
              )
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="owner">{t.owner}</SelectItem>
              <SelectItem value="admin">{t.admin}</SelectItem>
              <SelectItem value="member">{t.member}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {invites.length > 1 ? (
          <Button
            variant="ghost"
            size="icon"
            className="text-neutral-500 hover:text-red-600 dark:hover:text-red-400"
            onClick={() =>
              setInvites((current) =>
                current.filter((_, itemIndex) => itemIndex !== index),
              )
            }
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    ))}
  </div>
);

function isValidEmail(email: string): boolean {
  return z.string().email().safeParse(email.trim()).success;
}

export const AddInviteButton = ({
  invites,
  setInvites,
  t,
}: {
  invites: Invite[];
  setInvites: React.Dispatch<React.SetStateAction<Invite[]>>;
  t: MembersTranslations;
}) => (
  <Button
    variant="outline"
    onClick={() =>
      setInvites((current) => [...current, { email: "", role: "member" }])
    }
    className="mt-2 gap-2 text-neutral-600 dark:text-neutral-400"
    disabled={!isValidEmail(invites.at(-1)?.email ?? "")}
  >
    <Plus className="h-4 w-4" />
    {t.inviteModal.addEmail}
  </Button>
);

export const InviteDialogFooter = ({
  invites,
  isPending,
  onInvite,
  t,
}: {
  invites: Invite[];
  isPending: boolean;
  onInvite: () => void;
  t: MembersTranslations;
}) => {
  const hasEmail = invites.some((invite) => invite.email.trim() !== "");
  const hasInvalidEmail = invites.some(
    (invite) => invite.email.trim() !== "" && !isValidEmail(invite.email),
  );
  return (
    <DialogFooter className="sm:justify-stretch">
      <Button
        className="w-full"
        onClick={onInvite}
        disabled={!hasEmail || hasInvalidEmail || isPending}
      >
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {t.inviteModal.submit}
      </Button>
    </DialogFooter>
  );
};

export function InviteMemberModal({
  open,
  onOpenChange,
  orgId,
  t,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  t: MembersTranslations;
}) {
  const [invites, setInvites] = useState<Invite[]>([
    { email: "", role: "member" },
  ]);
  const inviteMembersMutation = useInviteMembersMutation(
    t,
    onOpenChange,
    setInvites,
  );

  const handleInvite = () => {
    const validInvites = invites.filter((inv) => inv.email.trim() !== "");
    if (validInvites.length === 0) return;

    for (const inv of validInvites) {
      if (!isValidEmail(inv.email)) {
        toast.error(`${t.inviteModal.invalidEmail}: ${inv.email}`);
        return;
      }
    }

    inviteMembersMutation.mutate({
      organizationId: orgId,
      invites: validInvites.map((invite) => ({
        email: invite.email.trim(),
        role: invite.role,
      })),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{t.inviteModal.title}</DialogTitle>
          <DialogDescription className="text-base">
            {t.inviteModal.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <InviteRows invites={invites} setInvites={setInvites} t={t} />
          <AddInviteButton invites={invites} setInvites={setInvites} t={t} />
        </div>
        <InviteDialogFooter
          invites={invites}
          isPending={inviteMembersMutation.isPending}
          onInvite={handleInvite}
          t={t}
        />
      </DialogContent>
    </Dialog>
  );
}
