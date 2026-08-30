"use client";

import type { KnowledgeTranslations } from "../contracts";

import { Button } from "@scibly/ui/components/button";
import { Card, CardContent } from "@scibly/ui/components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@scibly/ui/components/select";
import { useState } from "react";
import { toast } from "sonner";

import { api } from "@/shared/api/trpc/client";

export function DocumentDestinationCard({
  t,
  orgSlug,
  connected,
  destinationPageId,
  parent,
}: {
  t: KnowledgeTranslations;
  orgSlug: string;
  connected: boolean;
  destinationPageId: string | null;
  parent: { title: string; url: string } | null;
}) {
  const exists = destinationPageId !== null;
  const utils = api.useUtils();
  const [parentPageId, setParentPageId] = useState<string>("");
  const [moving, setMoving] = useState(false);

  const pages = api.integration.searchPages.useQuery(
    { orgSlug, provider: "NOTION", query: "" },
    { enabled: connected && (!exists || moving) },
  );

  const setDestination = api.knowledge.setDocumentDestination.useMutation({
    onSuccess: () => {
      toast.success(exists ? t.destination.moved : t.destination.created);
      setMoving(false);
      void utils.knowledge.list.invalidate({ orgSlug });
    },
    onError: (error) => toast.error(error.message),
  });

  const picker = (
    <>
      <Select value={parentPageId} onValueChange={setParentPageId}>
        <SelectTrigger className="h-9 w-full sm:w-72">
          <SelectValue
            placeholder={
              pages.isPending ? t.destination.loading : t.destination.select
            }
          />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {(pages.data?.pages ?? []).map((page) => (
            <SelectItem key={page.id} value={page.id}>
              {page.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        disabled={!parentPageId || setDestination.isPending}
        onClick={() => setDestination.mutate({ orgSlug, parentPageId })}
      >
        {setDestination.isPending
          ? exists
            ? t.destination.moving
            : t.destination.saving
          : exists
            ? t.destination.move
            : t.destination.save}
      </Button>
    </>
  );

  if (exists) {
    return (
      <div className="text-ink-muted flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-[13px]">
        <span>
          {t.destination.current}{" "}
          {parent ? (
            <a
              href={parent.url}
              target="_blank"
              rel="noreferrer"
              className="text-ink font-medium underline underline-offset-2"
            >
              {parent.title}
            </a>
          ) : (
            t.destination.currentUnknown
          )}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMoving((open) => !open)}
        >
          {moving ? t.form.cancel : t.destination.change}
        </Button>
        {moving ? (
          <div className="flex w-full flex-wrap items-center justify-end gap-2">
            {picker}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <Card className="order-first w-full">
      <CardContent className="flex flex-col gap-3 p-5">
        <div>
          <p className="text-ink text-sm font-medium">{t.destination.title}</p>
          <p className="text-ink-muted mt-1 text-[13px]">
            {connected ? t.destination.description : t.destination.notConnected}
          </p>
        </div>
        {connected ? (
          <div className="flex flex-wrap items-center gap-2">{picker}</div>
        ) : null}
        {connected &&
        !pages.isPending &&
        (pages.data?.pages.length ?? 0) === 0 ? (
          <p className="text-ink-faint text-[12px]">{t.destination.empty}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
