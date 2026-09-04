"use client";

import { cn } from "@scibly/ui/utils";
import { useState } from "react";

import {
  type Lesson,
  type Scene,
} from "../../../../lessons/builder/components/lesson-builder";
import {
  type Device,
  DEVICE_CATEGORIES,
  type PreviewMode,
  PreviewTab,
} from "./preview-tab";
import { SceneTab } from "./scene-tab";

type SidebarTab = "scene" | "preview";

export const SidebarTabs = ({
  active,
  onChange,
}: {
  active: SidebarTab;
  onChange: (tab: SidebarTab) => void;
}) => {
  return (
    <div className="border-hairline shrink-0 border-b-2 p-4 dark:border-neutral-800/60">
      <div className="bg-ground flex items-center rounded-xl p-1 dark:bg-neutral-900">
        {(["scene", "preview"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={cn(
              "h-8 flex-1 cursor-pointer rounded-[10px] text-[12px] font-semibold capitalize transition-all",
              active === tab
                ? "text-ink bg-white shadow-[0_2px_0_0_var(--color-edge)] dark:bg-neutral-800 dark:text-neutral-100 dark:shadow-none"
                : "text-ink-muted hover:text-ink dark:hover:text-neutral-300",
            )}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
};

export function RightSidebar({
  courseId,
  orgSlug,
  lesson,
  scene,
  scenes,
  sceneIndex,
  onSceneUpdate,
}: {
  courseId: string;
  orgSlug: string;
  lesson: Lesson;
  scene: Scene;
  scenes: Scene[];
  sceneIndex: number;
  onSceneUpdate: (id: string, updates: Partial<Scene>) => void;
}) {
  const [activeTab, setActiveTab] = useState<SidebarTab>("scene");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("mobile");
  const [selectedMobile, setSelectedMobile] = useState<Device>(
    DEVICE_CATEGORIES.mobile[2],
  );
  const [selectedDesktop, setSelectedDesktop] = useState<Device>(
    DEVICE_CATEGORIES.desktop[2],
  );

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white dark:bg-[#0A0A0A]">
      <SidebarTabs active={activeTab} onChange={setActiveTab} />

      <div className="no-scrollbar flex-1 overflow-y-auto">
        {activeTab === "scene" && (
          <SceneTab scene={scene} onSceneUpdate={onSceneUpdate} />
        )}
        {activeTab === "preview" && (
          <PreviewTab
            courseId={courseId}
            orgSlug={orgSlug}
            lesson={lesson}
            scene={scene}
            sceneIndex={sceneIndex}
            totalScenes={scenes.length}
            activeTab={activeTab}
            previewMode={previewMode}
            setPreviewMode={setPreviewMode}
            selectedMobile={selectedMobile}
            setSelectedMobile={setSelectedMobile}
            selectedDesktop={selectedDesktop}
            setSelectedDesktop={setSelectedDesktop}
          />
        )}
      </div>
    </div>
  );
}
