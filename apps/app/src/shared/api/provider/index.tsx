"use client";

import { TRPCReactProvider } from "@/shared/api/trpc/client";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <TRPCReactProvider>{children}</TRPCReactProvider>;
}
