import type { NodeViewProps } from "@tiptap/core";

import { cn } from "@scibly/ui/utils";
import { memo, useState } from "react";

import { useTranslation } from "@/i18n/hooks/use-translation";
import { getNodeAttributes } from "@/shared/content/editor/blocks/attributes/get-default-react-block-attributes";
import BlockOptionsMenuContent from "@/shared/content/editor/blocks/ui/react-block-wrapper/block-options-menu/block-options-menu-content";

import { MediaOptionsMenuItem, PopoverWrapper } from ".";

type BlockOptionsMenuProps = {
  isEditorEditable: boolean;
  nodeViewProps: NodeViewProps;
  docLink: string;
  blockOptionsChildren?: React.ReactNode;
  settingsContent?: React.ReactNode;
  tailwindGroup: string;

  showAlignment?: boolean;
};

const MemoContentComponent = memo(BlockOptionsMenuContent);

export const BlockOptionsMenu: React.FC<BlockOptionsMenuProps> = memo(
  (props) => {
    const { translations } = useTranslation("editorUi");
    const [isHovering, setIsHovering] = useState(false);
    const attrs = getNodeAttributes(props.nodeViewProps.node);
    const width = attrs.mediaBlockAttributes?.width;
    if (!props.docLink) throw new Error("docLink is required");
    if (!props.isEditorEditable) return null;

    const showSmallMenu = width && typeof width === "number" && width <= 200;

    const content = (
      <MemoContentComponent
        nodeViewProps={props.nodeViewProps}
        blockOptionsChildren={props.blockOptionsChildren}
        settingsContent={props.settingsContent}
        docLink={props.docLink}
        showAlignment={props.showAlignment}
      />
    );

    return (
      <div
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={cn(
          "group/block-options bg-ink/85 absolute top-2 right-2 z-10 hidden h-8 items-center rounded-[10px]",
          isHovering && "flex",
          props.tailwindGroup,
        )}
      >
        <>
          {!showSmallMenu ? (
            content
          ) : (
            <PopoverWrapper popoverContent={content}>
              <MediaOptionsMenuItem
                icon="Ellipsis"
                tooltip={translations.blockOptions.more}
                usePopover
              />
            </PopoverWrapper>
          )}
        </>
      </div>
    );
  },
);

BlockOptionsMenu.displayName = "BlockOptionsMenu";
export default BlockOptionsMenu;
