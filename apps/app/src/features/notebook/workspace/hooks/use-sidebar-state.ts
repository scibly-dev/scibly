"use client";

import { create } from "zustand";

export interface SidebarState {
  mobileLeftOpen: boolean;
  setMobileLeftOpen: (open: boolean) => void;
  desktopLeftOpen: boolean;
  setDesktopLeftOpen: (open: boolean) => void;
  mobileRightOpen: boolean;
  setMobileRightOpen: (open: boolean) => void;
  desktopRightOpen: boolean;
  setDesktopRightOpen: (open: boolean) => void;
  rightSidebarTab: "sources" | "media" | "studio";
  setRightSidebarTab: (tab: "sources" | "media" | "studio") => void;

  studioCoursePickerNonce: number;
  requestStudioCoursePicker: () => void;
  activeStudioTool: string | null;
  selectedImageEditorImageId: string | null;
  openStudioTool: (toolId: string, imageLookupKey?: string) => void;
  clearSelectedImageEditorImage: () => void;
  clearStudioTool: () => void;
}

const MOBILE_MEDIA_QUERY = "(max-width: 767px)";

export function openRightSidebar() {
  const sidebarState = useSidebarState.getState();
  const isMobile =
    typeof window !== "undefined" &&
    window.matchMedia(MOBILE_MEDIA_QUERY).matches;

  if (isMobile) {
    sidebarState.setMobileRightOpen(true);
  } else {
    sidebarState.setDesktopRightOpen(true);
  }

  sidebarState.setRightSidebarTab("studio");
}

export const useSidebarState = create<SidebarState>((set) => ({
  mobileLeftOpen: false,
  setMobileLeftOpen: (open) => set({ mobileLeftOpen: open }),
  desktopLeftOpen: true,
  setDesktopLeftOpen: (open) => set({ desktopLeftOpen: open }),
  mobileRightOpen: false,
  setMobileRightOpen: (open) => set({ mobileRightOpen: open }),
  desktopRightOpen: true,
  setDesktopRightOpen: (open) => set({ desktopRightOpen: open }),
  rightSidebarTab: "studio",
  setRightSidebarTab: (tab) => set({ rightSidebarTab: tab }),
  studioCoursePickerNonce: 0,
  requestStudioCoursePicker: () =>
    set((state) => ({
      studioCoursePickerNonce: state.studioCoursePickerNonce + 1,
    })),
  activeStudioTool: null,
  selectedImageEditorImageId: null,
  openStudioTool: (toolId, imageLookupKey) => {
    openRightSidebar();
    set({
      activeStudioTool: toolId,
      selectedImageEditorImageId:
        toolId === "imageEditor" ? (imageLookupKey ?? null) : null,
    });
  },
  clearSelectedImageEditorImage: () =>
    set({ selectedImageEditorImageId: null }),
  clearStudioTool: () =>
    set({ activeStudioTool: null, selectedImageEditorImageId: null }),
}));
