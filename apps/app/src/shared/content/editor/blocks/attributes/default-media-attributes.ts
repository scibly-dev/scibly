import type { NodeViewProps } from "@tiptap/react";

import {
  type BaseReactBlockAttributes,
  getNodeAttributes,
} from "@/shared/content/editor/blocks/attributes/get-default-react-block-attributes";
import typedUpdateAttributes from "@/shared/content/editor/blocks/attributes/typed-update-attributes";

export type Alignment = "left" | "center" | "right";

export type MediaBlockAttributes = {
  width: string | number;
  height: string | number;
  src: string | null;
  alignment: Alignment;
};

export const defaultMediaAttributes: MediaBlockAttributes = {
  width: "100%",
  height: "100%",
  src: null,
  alignment: "center",
};

export type MediaBlock = BaseReactBlockAttributes & {
  mediaBlockAttributes: MediaBlockAttributes;
};

export const updateMediaAttributes = (
  props: NodeViewProps,
  newAttributes: Partial<MediaBlockAttributes>,
) => {
  const mediaAttributes = getMediaAttributes(props.node);
  typedUpdateAttributes<MediaBlock, "mediaBlockAttributes">(
    props.updateAttributes,
    "mediaBlockAttributes",
    { ...mediaAttributes, ...newAttributes },
  );
};

export const getMediaAttributes = (
  node: NodeViewProps["node"],
): MediaBlockAttributes => {
  const attrs = getNodeAttributes(node);
  return attrs.mediaBlockAttributes ?? defaultMediaAttributes;
};
