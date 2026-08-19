import { type HostFrameRect } from "./viewport";

// Module scope: the writer and reader sit on opposite sides of the player tree.
let latest: HostFrameRect | null = null;

export function recordHostRect(viewport: HostFrameRect): void {
  latest = viewport;
}

export function readHostRect(): HostFrameRect | null {
  return latest;
}
