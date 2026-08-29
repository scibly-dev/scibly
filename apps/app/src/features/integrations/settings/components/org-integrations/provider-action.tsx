import type { ProviderRowProps } from "./provider-row";

import { Button } from "@scibly/ui/components/button";
import { ExternalLink, Unplug } from "lucide-react";

export const ProviderAction = ({
  provider,
  connection,
  isBusy,
  isConnectPending,
  t,
  onConnect,
  onDisconnect,
}: ProviderRowProps) => {
  if (connection) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onDisconnect}
        disabled={isBusy}
        className="gap-1.5 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
        aria-label={`${t.disconnectButton} ${provider.displayName}`}
      >
        <Unplug className="h-3.5 w-3.5" />
        {t.disconnectButton}
      </Button>
    );
  }
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onConnect}
      disabled={isConnectPending}
      className="gap-1.5"
      aria-label={`${t.connectButton} ${provider.displayName}`}
    >
      <ExternalLink className="h-3.5 w-3.5" />
      {t.connectButton}
    </Button>
  );
};
