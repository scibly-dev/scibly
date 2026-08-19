"use client";

import type {
  ShowcaseFixture,
  ShowcaseSnapshot,
  ShowcaseStore,
} from "@scibly/showcase";
import type { ChatTransport } from "ai";
import type { NotebookMessage } from "@/features/notebook/chat/contracts";

import { createShowcaseStore, showcaseFixture } from "@scibly/showcase";
import {
  createContext,
  use,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import {
  createDemoChatTransport,
  createDevScriptController,
  type DevScriptController,
} from "./demo-chat-transport";

type ShowcaseRuntime = {
  store: ShowcaseStore;
  transport: ChatTransport<NotebookMessage>;
  devScript: DevScriptController | undefined;
};

const ShowcaseRuntimeContext = createContext<ShowcaseRuntime | null>(null);

export function ShowcaseRuntimeProvider({
  children,
  fixture = showcaseFixture,
}: {
  children: React.ReactNode;
  fixture?: ShowcaseFixture;
}) {
  const [store] = useState(() => createShowcaseStore(fixture));
  const [devScript] = useState(() =>
    process.env.NODE_ENV === "development"
      ? createDevScriptController()
      : undefined,
  );
  const transport = useMemo(
    () => createDemoChatTransport(fixture, store, { devScript }),
    [fixture, store, devScript],
  );
  const value = useMemo(
    () => ({ store, transport, devScript }),
    [store, transport, devScript],
  );

  return (
    <ShowcaseRuntimeContext value={value}>{children}</ShowcaseRuntimeContext>
  );
}

export function useShowcaseRuntime(): ShowcaseRuntime {
  const runtime = use(ShowcaseRuntimeContext);
  if (!runtime) {
    throw new Error(
      "useShowcaseRuntime must be used within ShowcaseRuntimeProvider",
    );
  }
  return runtime;
}

export function useShowcaseSnapshot(): ShowcaseSnapshot {
  const { store } = useShowcaseRuntime();
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
}
