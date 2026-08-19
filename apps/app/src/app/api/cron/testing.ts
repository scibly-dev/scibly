import type { Mock } from "vitest";

export function cronRequest(
  url: string,
  options: { method: "GET" | "POST"; secret?: string; body?: unknown } = {
    method: "GET",
  },
) {
  const headers = new Headers();
  if (options.secret !== undefined) {
    headers.set("authorization", `Bearer ${options.secret}`);
  }
  return new Request(url, {
    method: options.method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}

export async function runDeferredWork(afterMock: Mock): Promise<void> {
  for (const [work] of afterMock.mock.calls) {
    await work();
  }
}
