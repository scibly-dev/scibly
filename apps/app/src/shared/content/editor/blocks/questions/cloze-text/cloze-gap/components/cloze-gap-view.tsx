"use client";

import { type NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { memo, useCallback } from "react";

import { useTranslation } from "@/i18n/hooks/use-translation";
import { stringAttribute } from "@/shared/content/editor/blocks/attributes/string-attribute";
import { CLOZE_GAP_NODE_NAME } from "@/shared/content/editor/blocks/questions/cloze-text/cloze-gap/schema";
import { AuthorGapInline } from "@/shared/content/editor/blocks/questions/cloze-text/components/author-gap-inline";

export const ClozeGapView = memo((props: NodeViewProps) => {
  const { translations } = useTranslation("editorUi");
  const gapId = stringAttribute(props.node, "gapId");
  const label = stringAttribute(props.node, "label") ?? "";

  const updateLabel = useCallback(
    (next: string) => {
      props.updateAttributes({ label: next });
    },
    [props],
  );

  const handleRemove = useCallback(() => {
    const pos = props.getPos();
    if (typeof pos !== "number") return;

    props.editor
      .chain()
      .focus()
      .deleteRange({ from: pos, to: pos + props.node.nodeSize })
      .run();
  }, [props]);

  return (
    <NodeViewWrapper
      as="span"
      className="inline align-baseline"
      data-cloze-gap-id={gapId}
      data-type={CLOZE_GAP_NODE_NAME}
    >
      <AuthorGapInline
        value={label}
        onChange={updateLabel}
        onRemove={handleRemove}
        placeholder={translations.clozeText.gapPlaceholder}
        removeLabel={translations.clozeText.removeGapLabel}
        onKeyDown={(event) => {
          if (event.key !== "Backspace") return;

          if (event.currentTarget.value !== "") return;
          const start = event.currentTarget.selectionStart ?? 0;
          const end = event.currentTarget.selectionEnd ?? 0;
          if (start === 0 && end === 0) {
            event.preventDefault();
            handleRemove();
          }
        }}
      />
    </NodeViewWrapper>
  );
});

ClozeGapView.displayName = "ClozeGapView";
export default ClozeGapView;
