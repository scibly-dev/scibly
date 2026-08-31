// @vitest-environment node
import { baseProxy } from "@scibly/next-proxy";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

const proxy = baseProxy();

const request = (pathname: string, { session = true } = {}) => {
  const cookies = ["i18nlang=de"];
  if (session) cookies.push("better-auth.session_token=stub");
  return new NextRequest(new URL(pathname, "http://localhost:3000"), {
    headers: { cookie: cookies.join("; ") },
  });
};

describe("baseProxy locale handling", () => {
  it("rewrites a locale-less protected route instead of redirecting", async () => {
    const response = await proxy(request("/profile/user-settings"));

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "http://localhost:3000/de/profile/user-settings",
    );
  });

  it("leaves files in public/ alone", async () => {
    const response = await proxy(
      request("/mascot/mascot-idle-lottie.json", { session: false }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("still redirects public routes to their locale-prefixed URL", async () => {
    const response = await proxy(request("/demo", { session: false }));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/de/demo",
    );
  });
});

describe("baseProxy embed handling", () => {
  const embedRequest = (pathname: string, acceptLanguage?: string) =>
    new NextRequest(new URL(pathname, "http://localhost:3000"), {
      headers: acceptLanguage ? { "accept-language": acceptLanguage } : {},
    });

  it("negotiates a language for an embed URL that names none", async () => {
    const response = await proxy(
      embedRequest("/embed/courses/abc", "en-GB,en"),
    );

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "http://localhost:3000/en/embed/courses/abc",
    );
  });

  it("survives an Accept-Language no locale matcher can parse", async () => {
    for (const [acceptLanguage, locale] of [
      ["*", "de"],
      ["en_US", "de"],
      ["x", "de"],

      ["*;q=0.5,en", "en"],
    ]) {
      const response = await proxy(
        embedRequest("/public/courses/abc", acceptLanguage),
      );

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        `http://localhost:3000/${locale}/public/courses/abc`,
      );
    }
  });

  it("lets the snippet override the visitor's language", async () => {
    const response = await proxy(
      embedRequest("/de/embed/courses/abc", "en-GB"),
    );

    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
    expect(response.headers.get("location")).toBeNull();
  });

  it("never writes a cookie onto the embedding site's visitors", async () => {
    for (const pathname of ["/embed/courses/abc", "/de/embed/courses/abc"]) {
      const response = await proxy(embedRequest(pathname));
      expect(response.headers.get("set-cookie")).toBeNull();
    }
  });

  it("stays framable either way", async () => {
    for (const pathname of ["/embed/courses/abc", "/de/embed/courses/abc"]) {
      const response = await proxy(embedRequest(pathname));
      expect(response.headers.get("content-security-policy")).toBe(
        "frame-ancestors *",
      );
    }
  });

  it("is the only thing that is framable", async () => {
    for (const pathname of [
      "/profile/user-settings",
      "/public/courses/abc",
      "/demo",
    ]) {
      const response = await proxy(request(pathname));
      expect(response.headers.get("content-security-policy")).toBe(
        "frame-ancestors 'none'",
      );
    }
  });
});

describe("baseProxy auth handling", () => {
  it("sends a signed-in visitor of an auth page to the dashboard", async () => {
    const response = await proxy(request("/de/auth/login"));

    expect(response.headers.get("location")).toContain("/profile/onboarding");
  });

  it("lets a signed-in visitor through to the MCP consent screen", async () => {
    const response = await proxy(request("/de/auth/mcp-consent?code=abc"));

    expect(response.headers.get("location")).toBeNull();
  });
});
