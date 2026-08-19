import { AppError } from "@scibly/api/application-error";
import { APP_ORIGIN, routes } from "@scibly/routes";
import { beforeEach, describe, expect, it, vi } from "vitest";

const learning = vi.hoisted(() => ({ requireAnonymousCourse: vi.fn() }));

vi.mock("@/features/learning/server", () => learning);

const { GET, OPTIONS } = await import("./route");

const COURSE = {
  id: "abc",
  title: "Fire Safety",
  organization: { name: "Acme" },
};

const get = (params: Record<string, string>) => {
  const url = new URL(routes.app.api.oembed);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return GET(new Request(url));
};

const courseUrl = `${APP_ORIGIN}/public/courses/abc`;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("oEmbed endpoint", () => {
  it("answers a consumer that resolved one of our course links", async () => {
    learning.requireAnonymousCourse.mockResolvedValue(COURSE);

    const response = await get({ url: courseUrl });

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=600, s-maxage=600",
    );
    await expect(response.json()).resolves.toMatchObject({
      version: "1.0",
      type: "rich",
      title: "Fire Safety",
    });
  });

  it("passes the consumer's size ceiling through", async () => {
    learning.requireAnonymousCourse.mockResolvedValue(COURSE);

    const response = await get({
      url: courseUrl,
      maxwidth: "320",
      maxheight: "400",
    });

    await expect(response.json()).resolves.toMatchObject({
      width: 320,
      height: 400,
    });
  });

  it("says nothing at all about a course it will not embed", async () => {
    learning.requireAnonymousCourse.mockRejectedValue(
      new AppError({
        code: "FORBIDDEN",
        applicationCode: "api.forbidden",
        message: "This course is not publicly accessible.",
      }),
    );

    const response = await get({ url: courseUrl });

    expect(response.status).toBe(404);
    expect(await response.text()).toBe("");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=60, s-maxage=60",
    );
  });

  it("does not turn an unreachable database into a cacheable 404", async () => {
    learning.requireAnonymousCourse.mockRejectedValue(
      new Error("Too many database connections opened"),
    );

    await expect(get({ url: courseUrl })).rejects.toThrow(/connections/);
  });

  it("refuses a url that is not a course of ours without asking the database", async () => {
    const response = await get({
      url: "https://evil.example.com/public/courses/abc",
    });

    expect(response.status).toBe(404);
    expect(learning.requireAnonymousCourse).not.toHaveBeenCalled();
  });

  it("names the spec's statuses for a missing url and an unsupported format", async () => {
    expect((await get({})).status).toBe(400);
    expect((await get({ url: courseUrl, format: "xml" })).status).toBe(501);
  });

  it("lets a browser-side consumer preflight", async () => {
    const response = await OPTIONS();

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
      "GET, OPTIONS",
    );
  });
});
