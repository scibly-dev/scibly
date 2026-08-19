import { constructTrpcUrl } from "@scibly/api/utils";
import { getBaseUrl } from "@scibly/lib";
import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";
import superjson from "superjson";

import { type AppRouter } from "@/server/api/root";

export const transformer = superjson;

export function getTrpcUrl() {
  return constructTrpcUrl(getBaseUrl());
}

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
