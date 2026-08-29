import type { ProviderRowProps } from "./provider-row";

import { CheckCircle2, XCircle } from "lucide-react";

export const ProviderStatus = ({
  connection,
  t,
}: Pick<ProviderRowProps, "connection" | "t">) => {
  if (!connection) {
    return (
      <p className="flex items-center gap-1 text-[11px] text-neutral-400">
        <XCircle className="h-3 w-3" />
        {t.notConnectedStatus}
      </p>
    );
  }
  return (
    <p className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
      <CheckCircle2 className="h-3 w-3" />
      {connection.workspaceName
        ? `${t.connectedStatus} · ${connection.workspaceName}`
        : t.connectedStatus}
    </p>
  );
};
