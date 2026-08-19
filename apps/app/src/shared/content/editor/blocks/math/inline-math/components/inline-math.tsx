import { cn } from "@scibly/ui/utils";
import { type NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { memo } from "react";

import { getNodeAttributes } from "@/shared/content/editor/blocks/attributes/get-default-react-block-attributes";
import MathBlockWrapper, {
  type _MathBlockAttributes,
  defaultData,
  type DefaultDataType,
} from "@/shared/content/editor/blocks/math/components/math-block-wrapper";
import shouldRenderBlock from "@/shared/content/editor/runtime/should-render-block";

const InlineMathComponent: React.FC<NodeViewProps> = memo((props) => {
  const attrs = getNodeAttributes<_MathBlockAttributes>(props.node);
  const formula = attrs.formula.trim();
  return (
    <NodeViewWrapper as={"span"}>
      <MathBlockWrapper
        nodeViewProps={props}
        type="inline"
        emptyFormulaBlockClassName="h-8"
        formulaWrapperClassName={cn(formula && "p-2 bg-transparent")}
      />
    </NodeViewWrapper>
  );
});

InlineMathComponent.displayName = "InlineMathComponent";

export const InlineMath: React.FC<NodeViewProps> = memo((props) => {
  const attrs = getNodeAttributes<_MathBlockAttributes>(props.node);
  const formula = attrs.formula.trim();
  return shouldRenderBlock<DefaultDataType>(
    defaultData,
    formula,
    props,
    InlineMathComponent,
  );
});

InlineMath.displayName = "InlineMath";
export default InlineMath;
