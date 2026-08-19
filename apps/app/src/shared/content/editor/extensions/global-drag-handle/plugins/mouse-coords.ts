import { Plugin } from "@tiptap/pm/state";

import { setLastMouseCoords } from "@/shared/content/editor/extensions/global-drag-handle/state/mouse-coords";

export function createMouseCoordsPlugin() {
  return new Plugin({
    props: {
      handleDOMEvents: {
        mousemove(_view, event) {
          setLastMouseCoords({ x: event.clientX, y: event.clientY });
          return false;
        },
        mouseleave() {
          setLastMouseCoords(null);
          return false;
        },
      },
    },
  });
}
