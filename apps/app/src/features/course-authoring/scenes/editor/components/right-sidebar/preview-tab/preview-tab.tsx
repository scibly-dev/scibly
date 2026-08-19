import useEventListener from "@scibly/lib/hooks/use-event-listener";
import { routes } from "@scibly/routes";
import { useCallback, useEffect, useRef, useState } from "react";

import { ANIMATION_VARIANTS } from "@/features/learning/course-player/client";

import {
  type Lesson,
  type Scene,
} from "../../../../../lessons/builder/components/lesson-builder";
import { lessonDesign } from "../design-tab";
import { DevicePreview } from "./device-preview";
import { PreviewControls } from "./preview-controls";
import { type Device, DEVICE_FRAME, type PreviewMode } from "./preview-devices";
import { PreviewHeader } from "./preview-header";

interface PreviewTabProps {
  courseId: string;
  orgSlug: string;
  lesson: Lesson;
  scene: Scene;
  sceneIndex: number;
  totalScenes: number;
  activeTab: "scene" | "design" | "preview";
  previewMode: PreviewMode;
  setPreviewMode: (mode: PreviewMode) => void;
  selectedMobile: Device;
  setSelectedMobile: (device: Device) => void;
  selectedDesktop: Device;
  setSelectedDesktop: (device: Device) => void;
}

function usePreviewScale({
  activeTab,
  previewMode,
  selectedMobile,
  selectedDesktop,
}: Pick<
  PreviewTabProps,
  "activeTab" | "previewMode" | "selectedMobile" | "selectedDesktop"
>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const updateScale = useCallback(() => {
    const container = containerRef.current;
    if (!container || activeTab !== "preview") return;

    const { clientWidth: width, clientHeight: height } = container;
    const device = previewMode === "mobile" ? selectedMobile : selectedDesktop;
    const targetWidth = device.width + DEVICE_FRAME * 2;
    const targetHeight = device.height + DEVICE_FRAME * 2;
    setScale(
      Math.min((width - 48) / targetWidth, (height - 48) / targetHeight, 1),
    );
  }, [activeTab, previewMode, selectedMobile, selectedDesktop]);
  useEventListener("resize", updateScale);
  useEffect(() => {
    if (activeTab !== "preview" || !containerRef.current) return;
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [activeTab, updateScale]);
  return { containerRef, scale };
}

function useFullscreen() {
  const ref = useRef<HTMLDivElement>(null);

  const [fullscreenEl, setFullscreenEl] = useState<HTMLDivElement | null>(null);

  useEventListener(
    "fullscreenchange",
    () =>
      setFullscreenEl(
        document.fullscreenElement === ref.current ? ref.current : null,
      ),
    ref,
  );
  const toggle = () =>
    document.fullscreenElement
      ? document.exitFullscreen()
      : ref.current?.requestFullscreen();
  return { ref, fullscreenEl, toggle };
}

export function PreviewTab({
  courseId,
  orgSlug,
  lesson,
  scene,
  sceneIndex,
  totalScenes,
  activeTab,
  previewMode,
  setPreviewMode,
  selectedMobile,
  setSelectedMobile,
  selectedDesktop,
  setSelectedDesktop,
}: PreviewTabProps) {
  const currentDevice =
    previewMode === "mobile" ? selectedMobile : selectedDesktop;
  const { containerRef, scale } = usePreviewScale({
    activeTab,
    previewMode,
    selectedMobile,
    selectedDesktop,
  });
  const {
    ref: fullscreenRef,
    fullscreenEl,
    toggle: toggleFullscreen,
  } = useFullscreen();
  const [animationKey, setAnimationKey] = useState(0);

  const variant = ANIMATION_VARIANTS[scene.animation ?? "FADE"];

  return (
    <div
      ref={fullscreenRef}
      className="flex h-full flex-col bg-white p-6 dark:bg-neutral-950"
    >
      <PreviewHeader
        onReplay={() => setAnimationKey((key) => key + 1)}
        previewHref={routes.app.profile.org(orgSlug).courses.preview(courseId)}
      />

      <div
        ref={containerRef}
        className="border-hairline bg-ground relative flex w-full flex-1 items-center justify-center overflow-hidden rounded-2xl border-2 dark:border-neutral-800/50 dark:bg-neutral-900/20"
      >
        <DevicePreview
          design={lessonDesign(lesson)}
          scene={scene}
          sceneIndex={sceneIndex}
          totalScenes={totalScenes}
          scale={scale}
          animationKey={animationKey}
          variant={variant}
          previewMode={previewMode}
          currentDevice={currentDevice}
        />
      </div>

      <PreviewControls
        mode={previewMode}
        currentDevice={currentDevice}
        fullscreenEl={fullscreenEl}
        onModeChange={setPreviewMode}
        onSelectMobile={setSelectedMobile}
        onSelectDesktop={setSelectedDesktop}
        onToggleFullscreen={toggleFullscreen}
      />
    </div>
  );
}
