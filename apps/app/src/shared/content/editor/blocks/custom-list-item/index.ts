import { ListItem } from "@tiptap/extension-list";

export const CustomListItem = ListItem.extend({
  addHtmlSchemaAwareness() {
    return {
      tag: "li",
      name: "List Item",
      description:
        "A single item in a bullet or ordered list. Can contain inline content.",
    };
  },

  addKeyboardShortcuts() {
    return {
      ...this.parent?.(),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Tab: () => {
        return this.editor.commands.sinkListItem(this.name) || true;
      },
    };
  },
});

export default CustomListItem;
