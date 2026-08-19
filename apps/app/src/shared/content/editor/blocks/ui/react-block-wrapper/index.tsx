import type { Node as PMNode } from "@tiptap/pm/model";
import type { NodeViewProps } from "@tiptap/react";

import { memo } from "react";

import { getNodeAttributes } from "@/shared/content/editor/blocks/attributes/get-default-react-block-attributes";
import { CUSTOM_GROUP_BLOCK_NODE_NAME } from "@/shared/content/editor/blocks/ui/react-block-wrapper/schema";

import { BlockOptionsMenu } from "./block-options-menu";
import Resizable from "./resizer";

type ReactBlockWrapperProps = {
  isEditorEditable: boolean;
  nodeViewProps: NodeViewProps;
  docLink: string;
  children: React.ReactNode;
  blockOptionsChildren?: React.ReactNode;
  settingsContent?: React.ReactNode;
  isVideo?: boolean;
  mediaLoading?: boolean;

  resizable?: boolean;

  showAlignment?: boolean;
};

const getTailwindGroup = (node: PMNode) => {
  const isGroupBlock = node.type.name === CUSTOM_GROUP_BLOCK_NODE_NAME;
  const groups = {
    wrapperGroup: "group/block-wrapper relative w-full",
    childGroup: "group-hover/block-wrapper:flex",
  };
  if (isGroupBlock) {
    groups.wrapperGroup = "group/group-block relative w-full";
    groups.childGroup = "group-hover/group-block:flex";
  }
  return groups;
};

export const ReactBlockWrapper: React.FC<ReactBlockWrapperProps> = memo(
  (props) => {
    const attrs = getNodeAttributes(props.nodeViewProps.node);
    const tailwindGroup = getTailwindGroup(props.nodeViewProps.node);
    const isResizable =
      props.resizable !== undefined ? props.resizable : attrs.isResizable;

    return isResizable ? (
      <>
        <Resizable
          isEditorEditable={props.isEditorEditable}
          node={props.nodeViewProps.node}
          updateAttributes={props.nodeViewProps.updateAttributes}
          isVideo={!!props.isVideo}
          mediaLoading={!!props.mediaLoading}
        >
          {props.children}
          <BlockOptionsMenu
            isEditorEditable={props.isEditorEditable}
            docLink={props.docLink}
            blockOptionsChildren={props.blockOptionsChildren}
            settingsContent={props.settingsContent}
            nodeViewProps={props.nodeViewProps}
            tailwindGroup={"group-hover/resizable:flex"}
            showAlignment={props.showAlignment}
          />
        </Resizable>
      </>
    ) : (
      <div className={tailwindGroup.wrapperGroup}>
        {props.children}
        <BlockOptionsMenu
          isEditorEditable={props.isEditorEditable}
          docLink={props.docLink}
          blockOptionsChildren={props.blockOptionsChildren}
          settingsContent={props.settingsContent}
          nodeViewProps={props.nodeViewProps}
          tailwindGroup={tailwindGroup.childGroup}
          showAlignment={props.showAlignment}
        />
      </div>
    );
  },
);

ReactBlockWrapper.displayName = "ReactBlockWrapper";
export default ReactBlockWrapper;
