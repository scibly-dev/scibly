import type { ReactNode } from "react";

import { PLAYER_FOOTER_DOCK_HEIGHT } from "./player-navigation-footer";

// Shared with the builder's device preview — this padding decides the
// phone-width content column in both places.
export function SceneViewportShell({ children }: { children: ReactNode }) {
  return (
    <div className="custom-scrollbar absolute inset-0 z-10 overflow-y-auto px-4 @min-[40rem]:px-6 @min-[48rem]:px-8">
      <div
        className="relative flex min-h-full w-full flex-col justify-center py-4 @min-[48rem]:py-10"
        style={{
          paddingBottom: `calc(${PLAYER_FOOTER_DOCK_HEIGHT} + 1rem)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
