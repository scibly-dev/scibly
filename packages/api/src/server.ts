import { type AnyRouter } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { headers } from "next/headers";
import { type NextRequest } from "next/server";
import { cache } from "react";

import "server-only";

import { createTRPCContext } from "./trpc";

export const createContext = cache(async () => {
  const heads = new Headers(await headers());
  heads.set("x-trpc-source", "rsc");

  return createTRPCContext({
    headers: heads,
  });
});

export const getTrpcRouteHandler = <TRouter extends AnyRouter>(
  appRouter: TRouter,
) => {
  return (req: NextRequest) =>
    fetchRequestHandler({
      endpoint: "/api/trpc",
      req,
      router: appRouter,
      createContext: ({ req }) => createTRPCContext({ headers: req.headers }),
    });
};
