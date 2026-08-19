import { APP_ORIGIN } from "@scibly/routes";
import { describe, expect, it } from "vitest";

import {
  buildOEmbedResponse,
  courseIdFromEmbeddableUrl,
  oEmbedDiscoveryUrl,
  parseSizeParam,
} from "./oembed";
import { DEFAULT_EMBED_HEIGHT, DEFAULT_EMBED_WIDTH } from "./snippet";

const COURSE = {
  id: "abc",
  title: "Fire Safety",
  organization: { name: "Acme" },
};

const response = (sizes: { maxWidth?: number; maxHeight?: number } = {}) =>
  buildOEmbedResponse({
    course: COURSE,
    maxWidth: sizes.maxWidth ?? null,
    maxHeight: sizes.maxHeight ?? null,
  });

describe("oEmbed url matching", () => {
  it("resolves every shape of course link a consumer could be handed", () => {
    for (const path of [
      "/public/courses/abc",
      "/en/public/courses/abc",
      "/de/public/courses/abc/",
      "/embed/courses/abc",
      "/de/embed/courses/abc",
    ]) {
      expect(courseIdFromEmbeddableUrl(`${APP_ORIGIN}${path}`)).toBe("abc");
    }
  });

  it("keeps query and hash out of the course id", () => {
    expect(
      courseIdFromEmbeddableUrl(`${APP_ORIGIN}/public/courses/abc?utm=x#top`),
    ).toBe("abc");
  });

  it("refuses anything that is not a course of ours", () => {
    for (const candidate of [
      "https://evil.example.com/public/courses/abc",
      `${APP_ORIGIN}/public/courses`,
      `${APP_ORIGIN}/public/courses/`,
      `${APP_ORIGIN}/public/courses/abc/lessons/1`,
      `${APP_ORIGIN}/profile/user-settings`,
      "not a url",
    ]) {
      expect(courseIdFromEmbeddableUrl(candidate)).toBeNull();
    }
  });

  it("round-trips the url it advertises for discovery", () => {
    const discovery = new URL(oEmbedDiscoveryUrl("abc"));

    expect(courseIdFromEmbeddableUrl(discovery.searchParams.get("url")!)).toBe(
      "abc",
    );
  });
});

describe("oEmbed size params", () => {
  it("treats anything but a positive whole number as unstated", () => {
    expect(parseSizeParam("480")).toBe(480);
    expect(parseSizeParam(null)).toBeNull();
    expect(parseSizeParam("0")).toBeNull();
    expect(parseSizeParam("-10")).toBeNull();
    expect(parseSizeParam("480.5")).toBeNull();
    expect(parseSizeParam("wide")).toBeNull();
  });
});

describe("oEmbed response", () => {
  it("describes the course to a consumer that named no size", () => {
    expect(response()).toMatchObject({
      version: "1.0",
      type: "rich",
      title: "Fire Safety",
      author_name: "Acme",
      width: DEFAULT_EMBED_WIDTH,
      height: DEFAULT_EMBED_HEIGHT,
    });
  });

  it("serves the frame the share sheet builds, without the script", () => {
    const { html } = response();

    expect(html).toContain(`src="${APP_ORIGIN}/embed/courses/abc"`);
    expect(html).toContain('title="Fire Safety"');
    expect(html).toContain("data-scibly-embed");

    expect(html).not.toContain("<script");
  });

  it("honours a consumer's ceiling but never pads past the lesson height", () => {
    expect(response({ maxHeight: 400 }).height).toBe(400);
    expect(response({ maxHeight: 2000 }).height).toBe(DEFAULT_EMBED_HEIGHT);
    expect(response({ maxWidth: 320 }).width).toBe(320);
  });

  it("keeps the reported size and the frame's own in step", () => {
    const { width, height, html } = response({ maxWidth: 320, maxHeight: 400 });

    expect(html).toContain(`width="${width}"`);
    expect(html).toContain(`height="${height}"`);
    expect(html).toContain(`height: ${height}px`);
  });

  it("omits the author when the course has no organization", () => {
    expect(
      buildOEmbedResponse({
        course: { ...COURSE, organization: null },
        maxWidth: null,
        maxHeight: null,
      }),
    ).not.toHaveProperty("author_name");
  });
});
