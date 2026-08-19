import type { Node } from "@tiptap/pm/model";

export type DragHandleTarget = {
  node: Node;
  pos: number;
} | null;

export type MouseCoords = {
  x: number;
  y: number;
};
