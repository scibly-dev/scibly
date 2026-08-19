import type { RefObject } from "react";

import useEventListener from "../use-event-listener";

type EventType = "mousedown" | "mouseup" | "touchstart" | "touchend";

export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null> | RefObject<T | null>[],
  handler: (event: MouseEvent | TouchEvent) => void,
  eventType: EventType = "mousedown",

  isInsideAdditional?: (target: Node) => boolean,
): void {
  useEventListener(eventType, (event) => {
    const target = event.target;

    if (!(target instanceof Node) || !target.isConnected) {
      return;
    }

    if (isInsideAdditional?.(target)) {
      return;
    }

    const isOutside = Array.isArray(ref)
      ? ref.every((r) => r.current && !r.current.contains(target))
      : ref.current && !ref.current.contains(target);

    if (isOutside) {
      handler(event);
    }
  });
}

export default useOnClickOutside;
