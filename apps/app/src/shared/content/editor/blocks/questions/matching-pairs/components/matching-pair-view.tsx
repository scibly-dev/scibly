"use client";

import { Button } from "@scibly/ui/components/button";
import {
  NodeViewContent,
  type NodeViewProps,
  NodeViewWrapper,
} from "@tiptap/react";
import { X } from "lucide-react";
import { memo } from "react";

import { useTranslation } from "@/i18n/hooks/use-translation";
import { stringAttribute } from "@/shared/content/editor/blocks/attributes/string-attribute";

export const MatchingPairView = memo((props: NodeViewProps) => {
  const { translations } = useTranslation("editorUi");
  const isAuthoring = props.editor.isEditable;
  const pairId = stringAttribute(props.node, "id");

  const handleRemovePair = () => {
    const pos = props.getPos();
    if (typeof pos !== "number") return;
    props.editor
      .chain()
      .focus()
      .deleteRange({ from: pos, to: pos + props.node.nodeSize })
      .run();
  };

  if (!isAuthoring) {
    return null;
  }

  return (
    <NodeViewWrapper className="matching-pair-row-wrapper group">
      <NodeViewContent />
      <Button
        variant="ghost"
        size="icon"
        onClick={handleRemovePair}
        className="matching-pair-delete mt-2 h-8 w-8 shrink-0 text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 dark:hover:bg-red-950/50"
        aria-label={translations.matchingPairs.removePairLabel}
        data-pair-id={pairId}
      >
        <X className="h-4 w-4" />
      </Button>
    </NodeViewWrapper>
  );
});

MatchingPairView.displayName = "MatchingPairView";
export default MatchingPairView;
