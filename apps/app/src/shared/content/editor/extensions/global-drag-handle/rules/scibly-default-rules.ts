import {
  defaultRules,
  type DragHandleRule,
} from "@tiptap/extension-drag-handle";

const listItemFirstChildNestedAware: DragHandleRule = {
  id: "listItemFirstChild",
  evaluate: ({ parent, isFirst, node }) => {
    if (!isFirst || parent?.type.name !== "listItem") {
      return 0;
    }

    if (node.type.name === "orderedList" || node.type.name === "bulletList") {
      return 0;
    }

    return 1000;
  },
};

const listWrapperDeprioritizeNestedAware: DragHandleRule = {
  id: "listWrapperDeprioritize",
  evaluate: ({ node, parent }) => {
    const listItemTypes = ["listItem", "taskItem"];
    const firstChild = node.firstChild;
    if (!firstChild || !listItemTypes.includes(firstChild.type.name)) {
      return 0;
    }

    if (parent && listItemTypes.includes(parent.type.name)) {
      return 0;
    }

    return 1000;
  },
};

export const sciblyDefaultDragRules: DragHandleRule[] = [
  ...defaultRules.filter(
    (rule) =>
      rule.id !== "listWrapperDeprioritize" && rule.id !== "listItemFirstChild",
  ),
  listItemFirstChildNestedAware,
  listWrapperDeprioritizeNestedAware,
];
