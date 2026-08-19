"use client";

import { createTRPCClientForApi, getQueryClient } from "@scibly/api/react";
import { getBaseUrl } from "@scibly/lib";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, loggerLink } from "@trpc/client";
import { httpLink } from "@trpc/client/links/httpLink";
import { createTRPCReact } from "@trpc/react-query";
import { useState } from "react";

import { env } from "@/env";
import { type AppRouter } from "@/server/api/root";

import { getTrpcUrl, transformer } from "./shared";

export const api = createTRPCReact<AppRouter>();
export { type RouterInputs, type RouterOutputs } from "./contracts";

export const vanillaApi = createTRPCClient<AppRouter>({
  links: [
    loggerLink({
      enabled: (op) =>
        env.NEXT_PUBLIC_ENV === "development" ||
        (op.direction === "down" && op.result instanceof Error),
    }),
    httpLink({
      transformer,
      url: getTrpcUrl(),
    }),
  ],
});

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClientForApi(api, getBaseUrl()),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {props.children}
      </api.Provider>
    </QueryClientProvider>
  );
}
