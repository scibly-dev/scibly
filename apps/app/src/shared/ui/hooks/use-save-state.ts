import { create } from "zustand";

interface SaveState {
  pendingSaves: number;
  addSave: () => void;
  removeSave: () => void;
  triggerDummySave: () => void;
}

export const useSaveState = create<SaveState>((set) => ({
  pendingSaves: 0,
  addSave: () => set((state) => ({ pendingSaves: state.pendingSaves + 1 })),
  removeSave: () =>
    set((state) => ({ pendingSaves: Math.max(0, state.pendingSaves - 1) })),
  triggerDummySave: () => {
    set((state) => ({ pendingSaves: state.pendingSaves + 1 }));
    setTimeout(() => {
      set((state) => ({ pendingSaves: Math.max(0, state.pendingSaves - 1) }));
    }, 800);
  },
}));
