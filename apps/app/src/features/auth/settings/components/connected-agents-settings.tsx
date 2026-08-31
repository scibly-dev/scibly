"use client";

import type { DictionaryPages } from "@/i18n/types";

import { Button } from "@scibly/ui/components/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/shared/api/trpc/client";
import { SettingsCard } from "@/shared/ui/settings-card";

export function ConnectedAgentsSettings({
  t,
}: {
  t: DictionaryPages["userSettings"];
}) {
  const copy = t.connectedAgents;
  const trpcUtils = api.useUtils();
  const agents = api.connectedAgent.list.useQuery();

  const revoke = api.connectedAgent.revoke.useMutation({
    onSuccess: (_result, variables) => {
      const name =
        agents.data?.find((agent) => agent.clientId === variables.clientId)
          ?.name ?? variables.clientId;
      toast.success(copy.disconnected.replace("{name}", name));
      void trpcUtils.connectedAgent.list.invalidate();
    },
    onError: () => toast.error(copy.error),
  });

  return (
    <SettingsCard title={copy.title} description={copy.description}>
      {agents.isPending ? (
        <Loader2 className="text-ink-soft h-4 w-4 animate-spin" />
      ) : agents.data?.length ? (
        <ul className="divide-edge divide-y">
          {agents.data.map((agent) => (
            <li
              key={agent.clientId}
              className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="text-foreground truncate text-sm font-medium">
                  {agent.name}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {[
                    ...agent.destinations,
                    copy.connectedOn.replace(
                      "{date}",
                      new Date(agent.connectedAt).toLocaleDateString(),
                    ),
                  ].join(" · ")}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={revoke.isPending}
                onClick={() => revoke.mutate({ clientId: agent.clientId })}
              >
                {copy.disconnect}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">{copy.empty}</p>
      )}
    </SettingsCard>
  );
}
