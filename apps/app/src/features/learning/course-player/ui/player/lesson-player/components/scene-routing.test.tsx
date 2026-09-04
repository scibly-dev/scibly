import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ANIMATION_VARIANTS } from "../../utils/player-helpers";
import { LessonSceneViewport } from "./lesson-scene-viewport";

vi.mock("@/shared/content/editor/runtime/content-editor", () => {
  const ContentEditor = () => <div data-testid="content-editor" />;
  return { ContentEditor };
});

vi.mock("@/shared/content/practice/practice-scene-frame", () => {
  const PracticeSceneFrame = () => <div data-testid="practice-frame" />;
  return { PracticeSceneFrame };
});

vi.mock("@/shared/ai/components/message", () => {
  const MessageResponse = ({ children }: { children: string }) => (
    <p>{children}</p>
  );
  return { MessageResponse };
});

const TIPTAP_DOC = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "hi" }] }],
};

function renderViewport(
  scene: { kind: "PRACTICE" | "DOCUMENT"; learnerContent: unknown },
  explanation?: string,
) {
  const { container } = render(
    <LessonSceneViewport
      sceneContent={
        {
          ...scene,
          isLoading: false,
          error: null,
        } as never
      }
      currentScene={{ id: "scene-1" } as never}
      variant={ANIMATION_VARIANTS.FADE}
      guideReaction="idle"
      explanation={explanation}
      t={{ navigation: {} } as never}
    />,
  );
  return container;
}

describe("scene routing", () => {
  it("renders a PRACTICE scene in the sandboxed frame, given the room", () => {
    const container = renderViewport({
      kind: "PRACTICE",
      learnerContent: "<div>app</div>",
    });
    expect(screen.getByTestId("practice-frame")).toBeTruthy();
    expect(screen.queryByTestId("content-editor")).toBeNull();
    expect(container.querySelector(".max-w-6xl")).toBeTruthy();
  });

  it("renders a DOCUMENT scene in the content editor", () => {
    const container = renderViewport({
      kind: "DOCUMENT",
      learnerContent: TIPTAP_DOC,
    });
    expect(screen.getByTestId("content-editor")).toBeTruthy();
    expect(screen.queryByTestId("practice-frame")).toBeNull();
    expect(container.querySelector(".max-w-2xl")).toBeTruthy();
  });

  it("keeps a legacy raw-HTML DOCUMENT scene out of the practice frame", () => {
    const container = renderViewport({
      kind: "DOCUMENT",
      learnerContent: "<p>legacy</p>",
    });
    expect(screen.getByTestId("content-editor")).toBeTruthy();
    expect(screen.queryByTestId("practice-frame")).toBeNull();
    expect(container.querySelector(".max-w-2xl")).toBeTruthy();
  });

  it("shows the author's note under a graded practice", () => {
    renderViewport(
      { kind: "PRACTICE", learnerContent: "<div>app</div>" },
      "The domain is spoofed.",
    );
    expect(screen.getByText("The domain is spoofed.")).toBeTruthy();
  });
});
