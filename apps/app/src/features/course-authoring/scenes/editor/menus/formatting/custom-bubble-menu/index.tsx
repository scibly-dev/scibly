import { isTextSelection } from "@tiptap/core";
import { useCurrentEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import React, { type ComponentProps, memo } from "react";

import useBubbleMenuCommands from "@/features/course-authoring/scenes/editor/menus/formatting/custom-bubble-menu/hooks/use-bubble-menu-commands";
import useChangeNodeMenuItems from "@/features/course-authoring/scenes/editor/menus/formatting/custom-bubble-menu/hooks/use-change-node-menu-items";
import useEditorState from "@/features/course-authoring/scenes/editor/menus/formatting/custom-bubble-menu/hooks/use-editor-state";
import useStandardBubbleMenuItems from "@/features/course-authoring/scenes/editor/menus/formatting/custom-bubble-menu/hooks/use-standard-bubble-menu-items";
import LinkItem from "@/features/course-authoring/scenes/editor/menus/formatting/custom-bubble-menu/link-item";
import ColorSelector from "@/features/course-authoring/scenes/editor/menus/formatting/custom-bubble-menu/selectors/color-selector";
import ContentTypeSelector from "@/features/course-authoring/scenes/editor/menus/formatting/custom-bubble-menu/selectors/content-type-selector";
import FontSelector from "@/features/course-authoring/scenes/editor/menus/formatting/custom-bubble-menu/selectors/font-selector";
import ToolbarButton from "@/features/course-authoring/scenes/editor/menus/formatting/custom-bubble-menu/toolbar-button";
import { Toolbar } from "@/shared/ui/components/toolbar";

const memoized = {
  LinkItem: memo(LinkItem),
  ColorSelector: memo(ColorSelector),
  FontSelector: memo(FontSelector),
  ContentTypeSelector: memo(ContentTypeSelector),
};

const floatingOptions = { placement: "top" as const, offset: 8 };

const shouldShow: NonNullable<
  ComponentProps<typeof BubbleMenu>["shouldShow"]
> = ({ editor, state, from, to }) => {
  const { doc, selection } = state;
  const { empty } = selection;

  const isEmptyTextBlock =
    !doc.textBetween(from, to).length && isTextSelection(state.selection);

  const isDisallowedBlock = editor.isActive("codeBlock");

  return (
    isTextSelection(selection) &&
    !empty &&
    !isDisallowedBlock &&
    !isEmptyTextBlock &&
    editor.isEditable
  );
};

export const CustomBubbleMenu = () => {
  const { editor: currentEditor } = useCurrentEditor();
  const { actionState, selectorState } = useEditorState(currentEditor);
  const commands = useBubbleMenuCommands(currentEditor);
  const changeNodeMenuItems = useChangeNodeMenuItems(currentEditor);
  const standardItems = useStandardBubbleMenuItems(currentEditor, actionState);

  if (!currentEditor) return <div style={{ display: "none" }} />;

  return (
    <BubbleMenu
      aria-label="Formatting options"
      pluginKey="customBubbleMenu"
      editor={currentEditor}
      options={floatingOptions}
      shouldShow={shouldShow}
      className="joyride-bubble-menu min-w-fit"
    >
      <Toolbar.Wrapper className="h-10 min-w-fit">
        {standardItems.map((item, index) => (
          <React.Fragment key={index}>
            <ToolbarButton item={item} />
            {item.useSeperator && <Toolbar.Divider />}
          </React.Fragment>
        ))}
        <memoized.LinkItem
          setLinkCommand={commands.onLink}
          unsetLinkCommand={commands.onUnsetLink}
          currentLink={selectorState.currentLink}
        />
        <memoized.ColorSelector
          onClearTextColor={commands.onClearColor}
          onClearHighlight={commands.onClearHighlight}
          textColorCommand={commands.onChangeColor}
          highlightColorCommand={commands.onChangeHighlight}
          currentTextColor={selectorState.currentTextColor}
          currentHighlightColor={selectorState.currentHighlightColor}
        />
        <memoized.FontSelector
          selectFontCommand={commands.onSetFont}
          currentFont={selectorState.currentFont}
        />
        <memoized.ContentTypeSelector
          groups={changeNodeMenuItems}
          currentNode={selectorState.currentNode}
        />
      </Toolbar.Wrapper>
    </BubbleMenu>
  );
};

CustomBubbleMenu.displayName = "CustomBubbleMenu";
export default CustomBubbleMenu;
