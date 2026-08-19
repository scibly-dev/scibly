import type { NodeViewProps } from "@tiptap/react";

import { Separator } from "@scibly/ui/components/separator";
import { floatingPanelClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import { type icons } from "lucide-react";
import Link from "next/link";

import { useTranslation } from "@/i18n/hooks/use-translation";
import { isUrl } from "@/lib/utils";
import {
  type Alignment,
  updateMediaAttributes,
} from "@/shared/content/editor/blocks/attributes/default-media-attributes";
import {
  type BaseReactBlockAttributes,
  EditableState,
  getNodeAttributes,
} from "@/shared/content/editor/blocks/attributes/get-default-react-block-attributes";
import typedUpdateAttributes from "@/shared/content/editor/blocks/attributes/typed-update-attributes";
import { BlockSettingsFooter } from "@/shared/content/editor/blocks/ui/block-settings-ui";
import { MediaOptionsMenuItem } from "@/shared/content/editor/blocks/ui/react-block-wrapper/block-options-menu/block-options-menu-item";
import { PopoverWrapper } from "@/shared/content/editor/blocks/ui/react-block-wrapper/block-options-menu/popover-wrapper";

const ALIGNMENT_ICON = {
  left: "AlignLeft",
  center: "AlignCenter",
  right: "AlignRight",
} satisfies Record<Alignment, keyof typeof icons>;

type BlockOptionsMenuContentProps = {
  blockOptionsChildren?: React.ReactNode;
  settingsContent?: React.ReactNode;
  docLink: string;
  nodeViewProps: NodeViewProps;

  showAlignment?: boolean;
};

export const BlockOptionsMenuContent: React.FC<BlockOptionsMenuContentProps> = (
  props,
) => {
  const { translations } = useTranslation("editorUi");
  const {
    nodeViewProps,
    docLink,
    blockOptionsChildren,
    settingsContent,
    showAlignment = true,
  } = props;

  const attrs = getNodeAttributes(nodeViewProps.node);

  const alignment =
    ALIGNMENT_ICON[attrs.mediaBlockAttributes?.alignment ?? "center"];
  const src = attrs.mediaBlockAttributes?.src;

  return (
    <>
      {blockOptionsChildren}
      {settingsContent && (
        <PopoverWrapper
          contentClassName={cn(
            floatingPanelClass,
            "z-50 h-auto w-[240px] flex-col items-stretch gap-0.5 p-1 dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-none",
          )}
          popoverContent={
            <div className="flex w-full flex-col">
              {settingsContent}
              <BlockSettingsFooter nodeViewProps={nodeViewProps} />
            </div>
          }
        >
          <MediaOptionsMenuItem
            icon="Settings"
            tooltip={translations.blockOptions.settings || "Settings"}
            usePopover
            seperatorType="vertical"
          />
        </PopoverWrapper>
      )}
      {showAlignment && attrs.mediaBlockAttributes?.alignment && (
        <PopoverWrapper
          contentClassName="bg-ink/85"
          popoverContent={
            <>
              <MediaOptionsMenuItem
                icon="AlignLeft"
                tooltip={translations.blockOptions.alignLeft}
                seperatorType="vertical"
                onClick={() =>
                  updateMediaAttributes(nodeViewProps, {
                    alignment: "left",
                  })
                }
              />
              <MediaOptionsMenuItem
                icon="AlignCenter"
                tooltip={translations.blockOptions.alignCenter}
                seperatorType="vertical"
                onClick={() =>
                  updateMediaAttributes(nodeViewProps, {
                    alignment: "center",
                  })
                }
              />
              <MediaOptionsMenuItem
                icon="AlignRight"
                tooltip={translations.blockOptions.alignRight}
                onClick={() =>
                  updateMediaAttributes(nodeViewProps, {
                    alignment: "right",
                  })
                }
              />
            </>
          }
        >
          <MediaOptionsMenuItem
            icon={alignment}
            tooltip={translations.blockOptions.align}
            usePopover
            seperatorType="vertical"
          />
        </PopoverWrapper>
      )}

      <Link
        href="#"
        rel="noopener noreferrer"
        onClick={() => {
          window.open(docLink, "_blank");
        }}
        className="flex items-center justify-center"
      >
        <MediaOptionsMenuItem
          icon="BookOpenText"
          tooltip={translations.blockOptions.documentation}
        />
      </Link>
      {src && isUrl(src) && <Separator className="h-6 w-px opacity-50" />}
      {src && isUrl(src) && (
        <Link
          href={src}
          target="_blank"
          className="flex items-center justify-center"
        >
          <MediaOptionsMenuItem
            icon="ExternalLink"
            tooltip={translations.blockOptions.openOriginal}
          />
        </Link>
      )}
      {attrs.isEditable !== EditableState.Default && (
        <Separator className="h-6 w-px opacity-50" />
      )}
      {attrs.isEditable !== EditableState.Default && (
        <MediaOptionsMenuItem
          icon={
            attrs.isEditable === EditableState.Editable ? "LockOpen" : "Lock"
          }
          tooltip={
            attrs.isEditable
              ? translations.blockOptions.preventLearnerEdit
              : translations.blockOptions.allowLearnerEdit
          }
          onClick={() =>
            typedUpdateAttributes<BaseReactBlockAttributes, "isEditable">(
              nodeViewProps.updateAttributes,
              "isEditable",
              attrs.isEditable === EditableState.Editable
                ? EditableState.NotEditable
                : EditableState.Editable,
            )
          }
        />
      )}
    </>
  );
};

BlockOptionsMenuContent.displayName = "BlockOptionsMenuContent";
export default BlockOptionsMenuContent;
