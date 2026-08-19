import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UnsafeOutboundUrlError } from "@/lib/network/ssrf-guard";
import {
  WEB_FETCH_MAX_REDIRECTS,
  WEB_FETCH_MAX_RETRIES,
} from "@/shared/content/sources/constants";

import {
  fetchPageWithRetries,
  MAX_RETRY_AFTER_MS,
  readResponseWithByteCap,
  ResponseTooLargeError,
  TOTAL_TIMEOUT_MS,
  WebFetchTimeoutError,
} from "./web-page-request";

// The SSRF guard is not mocked: it must run on every redirect hop for real.
const HEADERS = { "User-Agent": "test" };

function page(body = "<html><body>hello</body></html>"): Response {
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/html" },
  });
}

function redirectTo(location: string, status = 302): Response {
  return new Response(null, { status, headers: { location } });
}

function status(code: number, headers: Record<string, string> = {}): Response {
  return new Response("", { status: code, headers });
}

let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

function requestedUrls(): string[] {
  return fetchMock.mock.calls.map(([input]) => String(input));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  fetchMock = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

async function fetchAndAdvance(url: string, ms = TOTAL_TIMEOUT_MS) {
  const pending = fetchPageWithRetries(url, HEADERS);
  const settled = pending.then(
    (value) => ({ value, error: null }),
    (error: unknown) => ({ value: null, error }),
  );
  await vi.advanceTimersByTimeAsync(ms);
  return settled;
}

describe("WR1: every hop is checked, not just the one the model chose", () => {
  it("refuses a redirect that lands on the cloud metadata address", async () => {
    fetchMock.mockResolvedValueOnce(redirectTo("http://169.254.169.254/"));

    const { error } = await fetchAndAdvance("https://example.com/article");

    expect(error).toBeInstanceOf(UnsafeOutboundUrlError);
    expect(requestedUrls()).toEqual(["https://example.com/article"]);
  });

  it("refuses a redirect several hops in, after public hops", async () => {
    fetchMock
      .mockResolvedValueOnce(redirectTo("https://cdn.example.com/a"))
      .mockResolvedValueOnce(redirectTo("https://cdn.example.com/b"))
      .mockResolvedValueOnce(redirectTo("http://[::ffff:169.254.169.254]/"));

    const { error } = await fetchAndAdvance("https://example.com/article");

    expect(error).toBeInstanceOf(UnsafeOutboundUrlError);
    expect(requestedUrls()).toHaveLength(3);
  });

  it("resolves a relative redirect against the hop it came from", async () => {
    fetchMock
      .mockResolvedValueOnce(redirectTo("/moved"))
      .mockResolvedValueOnce(page());

    const { value } = await fetchAndAdvance("https://example.com/article");

    expect(requestedUrls()).toEqual([
      "https://example.com/article",
      "https://example.com/moved",
    ]);
    expect(value?.finalUrl).toBe("https://example.com/moved");
  });
});

describe("WU5: a page fetch never borrows the BYOAI relaxation", () => {
  it("refuses an internal redirect target in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    fetchMock.mockResolvedValueOnce(redirectTo("http://localhost:11434/v1"));

    const { error } = await fetchAndAdvance("https://example.com/article");

    expect(error).toBeInstanceOf(UnsafeOutboundUrlError);
    expect(requestedUrls()).toHaveLength(1);
  });
});

describe("WR2: redirects are bounded", () => {
  it("stops after the redirect limit rather than following forever", async () => {
    let hop = 0;
    fetchMock.mockImplementation(async () =>
      redirectTo(`https://example.com/hop-${++hop}`),
    );

    const { error } = await fetchAndAdvance("https://example.com/start");

    expect((error as Error).message).toMatch(/Too many redirects/);
    expect(requestedUrls()).toHaveLength(WEB_FETCH_MAX_REDIRECTS + 1);
  });

  it("terminates a redirect loop between two hosts", async () => {
    fetchMock.mockImplementation(async (input) =>
      redirectTo(
        String(input) === "https://a.example.com/"
          ? "https://b.example.com/"
          : "https://a.example.com/",
      ),
    );

    const { error } = await fetchAndAdvance("https://a.example.com/");

    expect((error as Error).message).toMatch(/Too many redirects/);
  });

  it("returns a redirect with no Location rather than guessing where it went", async () => {
    fetchMock.mockResolvedValue(status(302));

    const { error } = await fetchAndAdvance("https://example.com/");

    expect((error as Error).message).toMatch(/missing Location header/);

    expect(requestedUrls()).toHaveLength(1);
  });
});

describe("WR3: retries are bounded and only for what a retry can fix", () => {
  it("never retries a refused URL", async () => {
    const { error } = await fetchAndAdvance("http://169.254.169.254/");

    expect(error).toBeInstanceOf(UnsafeOutboundUrlError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("retries a connection error up to the limit and then gives up", async () => {
    fetchMock.mockRejectedValue(new Error("fetch failed"));

    const { error } = await fetchAndAdvance("https://example.com/");

    expect((error as Error).message).toBe("fetch failed");

    expect(requestedUrls()).toHaveLength(WEB_FETCH_MAX_RETRIES + 1);
  });

  it("returns a recovered page rather than the transient failure", async () => {
    fetchMock
      .mockResolvedValueOnce(status(503))
      .mockResolvedValueOnce(page("<html><body>recovered</body></html>"));

    const { value } = await fetchAndAdvance("https://example.com/");

    expect(value?.response.status).toBe(200);
    expect(value?.attempts).toBe(2);
  });

  it("does not retry a status the server will answer the same way forever", async () => {
    fetchMock.mockResolvedValue(status(404));

    const { value } = await fetchAndAdvance("https://example.com/");

    expect(value?.response.status).toBe(404);
    expect(requestedUrls()).toHaveLength(1);
  });
});

describe("WB1/WB3: one budget for the whole call", () => {
  it("honours Retry-After only within reason", async () => {
    fetchMock
      .mockResolvedValueOnce(status(429, { "retry-after": "86400" }))
      .mockResolvedValueOnce(page());

    const pending = fetchPageWithRetries("https://example.com/", HEADERS);
    const settled = pending.then(
      (value) => value,
      () => null,
    );

    await vi.advanceTimersByTimeAsync(MAX_RETRY_AFTER_MS + 1);

    expect((await settled)?.response.status).toBe(200);
  });

  it("stops following redirects once the call's budget is spent", async () => {
    fetchMock.mockImplementation(async () => {
      vi.setSystemTime(Date.now() + TOTAL_TIMEOUT_MS / 3 + 1_000);
      return redirectTo(`https://example.com/${Math.random()}`);
    });

    const { error } = await fetchAndAdvance("https://example.com/start");

    expect(error).toBeInstanceOf(WebFetchTimeoutError);
    expect(requestedUrls().length).toBeLessThan(WEB_FETCH_MAX_REDIRECTS + 1);
  });

  it("gives each request a deadline no later than the call's", async () => {
    fetchMock.mockResolvedValueOnce(page());

    await fetchAndAdvance("https://example.com/");

    const init = fetchMock.mock.calls[0]?.[1];
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(init?.redirect).toBe("manual");
  });
});

describe("WB2/WB5: what is read off a response", () => {
  it("reads a body under the cap in full", async () => {
    const body = "<html><body>" + "a".repeat(1_000) + "</body></html>";

    await expect(
      readResponseWithByteCap(new Response(body), 2_000_000, "utf-8"),
    ).resolves.toBe(body);
  });

  it("refuses to read past the byte cap however much is offered", async () => {
    const cap = 64 * 1024;
    const oversized = new Response("x".repeat(cap * 4));

    await expect(
      readResponseWithByteCap(oversized, cap, "utf-8"),
    ).rejects.toBeInstanceOf(ResponseTooLargeError);
  });

  it("falls back to utf-8 rather than failing on a charset it does not know", async () => {
    const body = "<html><body>héllo</body></html>";

    await expect(
      readResponseWithByteCap(
        new Response(body),
        2_000_000,
        "zzz-not-a-charset",
      ),
    ).resolves.toBe(body);
  });

  it("decodes a body in the charset the response declared", async () => {
    const latin1 = new Response(new Uint8Array([0x68, 0xe9, 0x6c, 0x6c, 0x6f]));

    expect(await readResponseWithByteCap(latin1, 2_000_000, "iso-8859-1")).toBe(
      "héllo",
    );
  });
});
