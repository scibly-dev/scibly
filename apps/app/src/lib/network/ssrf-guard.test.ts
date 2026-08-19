import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  assertSafeByoaiOutboundUrl,
  assertSafeOutboundUrl,
  assertSafeResolvedOutboundUrl,
  UnsafeOutboundUrlError,
} from "./ssrf-guard";

// This is the one suite that is about what DNS answers, so it says so itself
// rather than taking the setup file's public address.
const dns = vi.hoisted(() => ({ lookup: vi.fn() }));
vi.mock("node:dns/promises", () => ({ ...dns, default: dns }));

function refusal(url: string, policy?: "strict" | "byoai"): string {
  try {
    if (policy) assertSafeOutboundUrl(url, policy);
    else assertSafeOutboundUrl(url);
  } catch (error) {
    if (error instanceof UnsafeOutboundUrlError) return error.message;
    throw error;
  }
  throw new Error(`${url} was allowed through.`);
}

describe("WU1: addresses only our own server can reach", () => {
  it.each([
    { destination: "loopback", url: "http://127.0.0.1/" },
    { destination: "loopback by name", url: "http://localhost/" },
    {
      destination: "loopback by name, qualified",
      url: "http://localhost.localdomain/",
    },
    { destination: "the unspecified address", url: "http://0.0.0.0/" },
    {
      destination: "cloud metadata",
      url: "http://169.254.169.254/latest/meta-data/",
    },
    {
      destination: "cloud metadata by name",
      url: "http://metadata.google.internal/",
    },
    { destination: "a private 10/8 host", url: "http://10.0.0.5/" },
    { destination: "a private 172.16/12 host", url: "http://172.20.1.1/" },
    { destination: "a private 192.168/16 host", url: "http://192.168.1.1/" },
    { destination: "a carrier-grade-NAT host", url: "http://100.64.0.1/" },
    { destination: "an internal service name", url: "http://redis.internal/" },
    { destination: "an mDNS name", url: "http://printer.local/" },
  ])("refuses $destination before any connection", ({ url }) => {
    expect(refusal(url)).toBe("Private or internal URLs are not allowed.");
  });

  it.each([
    { destination: "a public host", url: "https://example.com/article" },
    { destination: "a public address", url: "https://8.8.8.8/" },
    { destination: "a public IPv6 address", url: "https://[2606:4700::1111]/" },
    {
      destination: "a public host on an unusual port",
      url: "https://example.com:8443/",
    },

    {
      destination: "a public host just past the 172.16/12 range",
      url: "https://172.32.0.1/",
    },
    {
      destination: "a public host just past the 100.64/10 range",
      url: "https://100.128.0.1/",
    },
  ])("allows $destination", ({ url }) => {
    expect(() => assertSafeOutboundUrl(url)).not.toThrow();
  });
});

describe("WU2: the address, however it is written", () => {
  it.each([
    { spelling: "decimal", url: "http://2130706433/" },
    { spelling: "hex", url: "http://0x7f000001/" },
    { spelling: "octal", url: "http://0177.0.0.1/" },
    { spelling: "short-form dotted", url: "http://127.1/" },
    { spelling: "IPv4 with a trailing dot", url: "http://127.0.0.1./" },
  ])("refuses loopback written in $spelling", ({ url }) => {
    expect(refusal(url)).toBe("Private or internal URLs are not allowed.");
  });

  it.each([
    { spelling: "IPv6 loopback", url: "http://[::1]/" },
    {
      spelling: "IPv6 loopback written out in full",
      url: "http://[0:0:0:0:0:0:0:1]/",
    },
    { spelling: "the IPv6 unspecified address", url: "http://[::]/" },
    { spelling: "an IPv6 unique-local address", url: "http://[fd00::1]/" },
    { spelling: "an IPv6 link-local address", url: "http://[fe80::1]/" },
    {
      spelling: "loopback as IPv4-mapped IPv6",
      url: "http://[::ffff:127.0.0.1]/",
    },
    {
      spelling: "cloud metadata as IPv4-mapped IPv6",
      url: "http://[::ffff:169.254.169.254]/",
    },
    {
      spelling: "cloud metadata as IPv4-mapped IPv6 in hextets",
      url: "http://[::ffff:a9fe:a9fe]/",
    },
    {
      spelling: "a private host as IPv4-compatible IPv6",
      url: "http://[::10.0.0.5]/",
    },
  ])("refuses an internal destination written as $spelling", ({ url }) => {
    expect(refusal(url)).toBe("Private or internal URLs are not allowed.");
  });

  it.each([
    { spelling: "localhost", url: "http://localhost./" },
    { spelling: "the metadata name", url: "http://metadata.google.internal./" },
    { spelling: "an internal service name", url: "http://redis.internal./" },
  ])("refuses $spelling with a trailing dot", ({ url }) => {
    expect(refusal(url)).toBe("Private or internal URLs are not allowed.");
  });
});

describe("WU3/WU4: what is not a page fetch at all", () => {
  it.each([
    { scheme: "file", url: "file:///etc/passwd" },
    { scheme: "data", url: "data:text/html,<h1>hi</h1>" },
    { scheme: "ftp", url: "ftp://example.com/x" },
    { scheme: "gopher", url: "gopher://example.com/" },
  ])("refuses $scheme: rather than dialling it", ({ url }) => {
    expect(refusal(url)).toBe("Only HTTP and HTTPS URLs are allowed.");
  });

  it.each([
    { malformation: "not a URL at all", url: "not a url" },
    { malformation: "empty", url: "" },
    { malformation: "a scheme with no host", url: "http://" },

    {
      malformation: "an IPv6 literal with a zone id",
      url: "http://[fe80::1%25eth0]/",
    },
  ])(
    "refuses a URL that is $malformation rather than passing it on",
    ({ url }) => {
      expect(refusal(url)).toBe("Invalid URL.");
    },
  );
});

describe("WU5: the BYOAI relaxation is never a page fetch's policy", () => {
  it("keeps refusing an internal host under the default policy in development", async () => {
    vi.stubEnv("NODE_ENV", "development");

    expect(refusal("http://localhost:11434/v1")).toBe(
      "Private or internal URLs are not allowed.",
    );
    expect(refusal("http://localhost:11434/v1", "strict")).toBe(
      "Private or internal URLs are not allowed.",
    );
    await expect(
      assertSafeByoaiOutboundUrl("http://localhost:11434/v1"),
    ).resolves.toBeUndefined();
  });

  it("refuses an internal host even under the BYOAI policy outside development", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(refusal("http://localhost:11434/v1", "byoai")).toBe(
      "Private or internal URLs are not allowed.",
    );
  });
});

describe("a public name is only as public as what it resolves to", () => {
  beforeEach(() => {
    dns.lookup.mockReset();
  });

  async function resolvedRefusal(url: string): Promise<string> {
    try {
      await assertSafeResolvedOutboundUrl(url);
    } catch (error) {
      if (error instanceof UnsafeOutboundUrlError) return error.message;
      throw error;
    }
    throw new Error(`${url} was allowed through.`);
  }

  it.each([
    {
      record: "a private 10/8 address",
      answers: [{ address: "10.0.0.5", family: 4 }],
    },
    {
      record: "the metadata address",
      answers: [{ address: "169.254.169.254", family: 4 }],
    },
    {
      record: "a unique-local IPv6 address",
      answers: [{ address: "fd00::1", family: 6 }],
    },
    {
      record: "a public address and a loopback one",
      answers: [
        { address: "93.184.216.34", family: 4 },
        { address: "127.0.0.1", family: 4 },
      ],
    },
  ])("refuses a name whose record answers $record", async ({ answers }) => {
    dns.lookup.mockResolvedValue(answers);

    expect(await resolvedRefusal("https://rebind.example.com/")).toBe(
      "Private or internal URLs are not allowed.",
    );
  });

  it("allows a name that answers with a public address", async () => {
    dns.lookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);

    await expect(
      assertSafeResolvedOutboundUrl("https://example.com/page"),
    ).resolves.toBeUndefined();
  });

  it("refuses a name that resolves to nothing at all", async () => {
    dns.lookup.mockRejectedValue(new Error("ENOTFOUND"));

    expect(await resolvedRefusal("https://gone.example.com/")).toBe(
      "Could not resolve the host.",
    );
  });

  it("does not look up a literal, which was already judged as itself", async () => {
    await expect(
      assertSafeResolvedOutboundUrl("https://93.184.216.34/page"),
    ).resolves.toBeUndefined();

    expect(dns.lookup).not.toHaveBeenCalled();
  });
});
