import Icon from "@scibly/ui/components/icon";
import { findParentNode, useCurrentEditor } from "@tiptap/react";
import { BubbleMenu as BaseBubbleMenu } from "@tiptap/react/menus";
import { useCallback } from "react";

import { useTranslation } from "@/i18n/hooks/use-translation";
import { ColumnLayout } from "@/shared/content/editor/blocks/column/nodes/columns";
import { Toolbar } from "@/shared/ui/components/toolbar";

const floatingOptions = { placement: "top" as const, offset: 8 };

export function ColumnsMenu() {
  const { translations } = useTranslation("editorUi");
  const { editor } = useCurrentEditor();

  const shouldShow = useCallback(
    () => editor?.isActive("columns") ?? false,
    [editor],
  );
  const setLayout = (layout: ColumnLayout) => {
    editor?.chain().focus().setLayout(layout).run();
  };

  if (!editor || editor.isEditable === false) return null;

  return (
    <div>
      <BaseBubbleMenu
        editor={editor}
        pluginKey="columnsMenu"
        shouldShow={shouldShow}
        updateDelay={50}
        options={floatingOptions}
        getReferencedVirtualElement={() => {
          const parentNode = findParentNode(
            (node) => node.type.name === "columns",
          )(editor.state.selection);
          if (!parentNode) return null;
          const domNode = editor.view.nodeDOM(parentNode.pos);
          if (!(domNode instanceof HTMLElement)) return null;
          const rect = domNode.getBoundingClientRect();
          const centeredRect = new DOMRect(
            rect.left + rect.width / 2,
            rect.top,
            0,
            rect.height,
          );
          return {
            getBoundingClientRect: () => centeredRect,
            getClientRects: () => [centeredRect],
          };
        }}
      >
        <Toolbar.Wrapper>
          <Toolbar.Button
            tooltip={translations.columnsMenu.sidebarLeft}
            active={editor.isActive("columns", {
              layout: ColumnLayout.SidebarLeft,
            })}
            onClick={() => setLayout(ColumnLayout.SidebarLeft)}
          >
            <Icon name="PanelLeft" />
          </Toolbar.Button>
          <Toolbar.Button
            tooltip={translations.columnsMenu.twoColumns}
            active={editor.isActive("columns", {
              layout: ColumnLayout.TwoColumn,
            })}
            onClick={() => setLayout(ColumnLayout.TwoColumn)}
          >
            <Icon name="Columns2" />
          </Toolbar.Button>
          <Toolbar.Button
            tooltip={translations.columnsMenu.sidebarRight}
            active={editor.isActive("columns", {
              layout: ColumnLayout.SidebarRight,
            })}
            onClick={() => setLayout(ColumnLayout.SidebarRight)}
          >
            <Icon name="PanelRight" />
          </Toolbar.Button>
        </Toolbar.Wrapper>
      </BaseBubbleMenu>
    </div>
  );
}
