import {
  type AnyMutationProcedure,
  type inferRouterInputs,
  type inferRouterOutputs,
  type TRPCRouterRecord,
} from "@trpc/server";

import { type AppRouter } from "@/server/api/root";

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

// v11 keeps procedures nested one level per sub-router, so the dotted path has
// to be walked out rather than read off a key.
type MutationPaths<TRecord> = {
  [TKey in keyof TRecord & string]: TRecord[TKey] extends AnyMutationProcedure
    ? TKey
    : TRecord[TKey] extends TRPCRouterRecord
      ? `${TKey}.${MutationPaths<TRecord[TKey]>}`
      : never;
}[keyof TRecord & string];

export type RouterMutationPath = MutationPaths<AppRouter["_def"]["procedures"]>;
