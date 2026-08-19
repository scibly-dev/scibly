import { type NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { memo } from "react";

import { getNodeAttributes } from "@/shared/content/editor/blocks/attributes/get-default-react-block-attributes";
import {
  defaultData,
  type DefaultDataType,
} from "@/shared/content/editor/blocks/math/components/math-block-wrapper";
import MathBlockWrapper, {
  type _MathBlockAttributes,
} from "@/shared/content/editor/blocks/math/components/math-block-wrapper";
import shouldRenderBlock from "@/shared/content/editor/runtime/should-render-block";

const BlockMathComponent: React.FC<NodeViewProps> = memo((props) => {
  return (
    <NodeViewWrapper>
      <MathBlockWrapper nodeViewProps={props} type="block" />
    </NodeViewWrapper>
  );
});

BlockMathComponent.displayName = "BlockMathComponent";

export const BlockMath: React.FC<NodeViewProps> = memo((props) => {
  const attrs = getNodeAttributes<_MathBlockAttributes>(props.node);
  const formula = attrs.formula;

  return shouldRenderBlock<DefaultDataType, string>(
    defaultData,
    formula.trim(),
    props,
    BlockMathComponent,
  );
});

BlockMath.displayName = "BlockMath";
export default BlockMath;
