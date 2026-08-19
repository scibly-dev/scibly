import type { CreateTRPCReactBase } from "@trpc/react-query";

import { loadPackageEnv } from "@scibly/lib/internal";
import { type QueryClient } from "@tanstack/react-query";
import {
  type CreateTRPCClientOptions,
  httpBatchStreamLink,
  httpLink,
  httpSubscriptionLink,
  isNonJsonSerializable,
  loggerLink,
  splitLink,
  type TRPCClient,
} from "@trpc/client";
import { type AnyRouter } from "@trpc/server";
import superjson from "superjson";

import { createQueryClient } from "./query-client";
import { constructTrpcUrl } from "./utils";

const env = loadPackageEnv("@scibly/api", {
  NODE_ENV: process.env.NODE_ENV,
});

let clientQueryClientSingleton: QueryClient | undefined = undefined;
export const getQueryClient = () => {
  if (typeof window === "undefined") {
    return createQueryClient();
  }

  return (clientQueryClientSingleton ??= createQueryClient());
};

export const createTRPCClientForApi = <TRouter extends AnyRouter>(
  api: CreateTRPCReactBase<TRouter, unknown>,
  baseUrl: string,
): TRPCClient<TRouter> => {
  const trpcUrl = constructTrpcUrl(baseUrl);
  const transformer = superjson;

  const options = {
    links: [
      loggerLink({
        enabled: (op) =>
          env.NODE_ENV === "development" ||
          (op.direction === "down" && op.result instanceof Error),
      }),
      splitLink({
        condition: (op) => op.type === "subscription",
        true: httpSubscriptionLink({
          url: trpcUrl,
          transformer,
        }),
        false: splitLink({
          condition: (op) => isNonJsonSerializable(op.input),
          true: httpLink({
            url: trpcUrl,
            transformer: {
              serialize: (data) => data,

              deserialize: transformer.deserialize,
            },
          }),
          false: httpBatchStreamLink({
            url: trpcUrl,
            transformer: transformer,
            headers: () => {
              const headers = new Headers();
              headers.set("x-trpc-source", "nextjs-react");
              return headers;
            },
          }),
        }),
      }),
    ],
  };

  // SAFETY: every caller builds its router with the superjson transformer, but

  return api.createClient(options as CreateTRPCClientOptions<TRouter>);
};
