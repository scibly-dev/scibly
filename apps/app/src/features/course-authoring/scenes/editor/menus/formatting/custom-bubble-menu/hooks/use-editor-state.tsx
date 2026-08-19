import type { Editor } from "@tiptap/react";
import type {
  FontColor,
  HighlightColor,
} from "@/features/course-authoring/scenes/editor/menus/formatting/custom-bubble-menu/selectors/color-selector";
import type { FontFamilies } from "@/features/course-authoring/scenes/editor/menus/formatting/custom-bubble-menu/selectors/font-selector";

import { useEffect, useReducer } from "react";

import useChangeNodeMenuItems, {
  type ChangeNodeMenuGroup,
  type ChangeNodeMenuItem,
} from "@/features/course-authoring/scenes/editor/menus/formatting/custom-bubble-menu/hooks/use-change-node-menu-items";
import {
  asFontColor,
  asHighlightColor,
} from "@/features/course-authoring/scenes/editor/menus/formatting/custom-bubble-menu/selectors/color-selector";
import { asFontFamily } from "@/features/course-authoring/scenes/editor/menus/formatting/custom-bubble-menu/selectors/font-selector";

const getCurrentNode = (allItems: ChangeNodeMenuGroup[]) => {
  return allItems
    .flatMap((group) => group.items)
    .find((item) => item.isActive());
};

type SelectorState = {
  currentNode: ChangeNodeMenuItem | undefined;
  currentTextColor?: FontColor;
  currentHighlightColor?: HighlightColor;
  currentFont: FontFamilies;
  currentLink: string;
};

export type ActionState = {
  isBold: boolean;
  isItalic: boolean;
  isStrike: boolean;
  isUnderline: boolean;
  isCode: boolean;
  isAlignLeft: boolean;
  isAlignCenter: boolean;
  isAlignRight: boolean;
  isAlignJustify: boolean;
};

const initialSelectorState: SelectorState = {
  currentNode: undefined,
  currentTextColor: undefined,
  currentHighlightColor: undefined,
  currentFont: "Arial",
  currentLink: "",
};

const initialActionState: ActionState = {
  isBold: false,
  isItalic: false,
  isStrike: false,
  isUnderline: false,
  isCode: false,
  isAlignLeft: false,
  isAlignCenter: false,
  isAlignRight: false,
  isAlignJustify: false,
};

type SelectorStateAction =
  | { type: "SET_CURRENT_NODE"; payload: ChangeNodeMenuItem | undefined }
  | { type: "SET_CURRENT_TEXT_COLOR"; payload: FontColor | undefined }
  | { type: "SET_CURRENT_HIGHLIGHT_COLOR"; payload: HighlightColor | undefined }
  | { type: "SET_CURRENT_FONT"; payload: FontFamilies }
  | { type: "SET_CURRENT_LINK"; payload: string };

type ActionStateAction =
  | { type: "SET_IS_BOLD"; payload: boolean }
  | { type: "SET_IS_ITALIC"; payload: boolean }
  | { type: "SET_IS_STRIKE"; payload: boolean }
  | { type: "SET_IS_UNDERLINE"; payload: boolean }
  | { type: "SET_IS_CODE"; payload: boolean }
  | { type: "SET_IS_ALIGN_LEFT"; payload: boolean }
  | { type: "SET_IS_ALIGN_CENTER"; payload: boolean }
  | { type: "SET_IS_ALIGN_RIGHT"; payload: boolean }
  | { type: "SET_IS_ALIGN_JUSTIFY"; payload: boolean };

const selectorReducer = (
  state: SelectorState,
  action: SelectorStateAction,
): SelectorState => {
  switch (action.type) {
    case "SET_CURRENT_NODE":
      return { ...state, currentNode: action.payload };
    case "SET_CURRENT_TEXT_COLOR":
      return { ...state, currentTextColor: action.payload };
    case "SET_CURRENT_HIGHLIGHT_COLOR":
      return { ...state, currentHighlightColor: action.payload };
    case "SET_CURRENT_FONT":
      return { ...state, currentFont: action.payload };
    case "SET_CURRENT_LINK":
      return { ...state, currentLink: action.payload };
    default:
      return state;
  }
};

const actionReducer = (
  state: ActionState,
  action: ActionStateAction,
): ActionState => {
  switch (action.type) {
    case "SET_IS_BOLD":
      return { ...state, isBold: action.payload };
    case "SET_IS_ITALIC":
      return { ...state, isItalic: action.payload };
    case "SET_IS_STRIKE":
      return { ...state, isStrike: action.payload };
    case "SET_IS_UNDERLINE":
      return { ...state, isUnderline: action.payload };
    case "SET_IS_CODE":
      return { ...state, isCode: action.payload };
    case "SET_IS_ALIGN_LEFT":
      return { ...state, isAlignLeft: action.payload };
    case "SET_IS_ALIGN_CENTER":
      return { ...state, isAlignCenter: action.payload };
    case "SET_IS_ALIGN_RIGHT":
      return { ...state, isAlignRight: action.payload };
    case "SET_IS_ALIGN_JUSTIFY":
      return { ...state, isAlignJustify: action.payload };
    default:
      return state;
  }
};

const useEditorState = (editor: Editor | null) => {
  const changeNodeMenuItems = useChangeNodeMenuItems(editor);

  const [actionState, actionDispatch] = useReducer(
    actionReducer,
    initialActionState,
  );
  const [selectorState, selectorDispatch] = useReducer(
    selectorReducer,
    initialSelectorState,
  );

  useEffect(() => {
    const handler = ({ editor: currentEditor }: { editor: Editor }) => {
      if (!editor) return;
      const { selection } = editor.state;
      if (selection.empty) {
        return;
      }
      const textAttributes = currentEditor.getAttributes("textStyle");
      const highlightAttributes = currentEditor.getAttributes("highlight");
      const linkAttributes = currentEditor.getAttributes("link");

      const newTextColor = asFontColor(textAttributes.color);
      if (newTextColor !== selectorState.currentTextColor) {
        selectorDispatch({
          type: "SET_CURRENT_TEXT_COLOR",
          payload: newTextColor,
        });
      }

      const newHighlightColor = asHighlightColor(highlightAttributes.color);
      if (newHighlightColor !== selectorState.currentHighlightColor) {
        selectorDispatch({
          type: "SET_CURRENT_HIGHLIGHT_COLOR",
          payload: newHighlightColor,
        });
      }

      const newFont =
        asFontFamily(textAttributes.fontFamily) ??
        initialSelectorState.currentFont;
      if (newFont !== selectorState.currentFont) {
        selectorDispatch({ type: "SET_CURRENT_FONT", payload: newFont });
      }

      const href: unknown = linkAttributes.href;
      const newLink = typeof href === "string" ? href : "";
      if (newLink !== selectorState.currentLink) {
        selectorDispatch({ type: "SET_CURRENT_LINK", payload: newLink });
      }

      const isBold = currentEditor.isActive("bold");
      if (isBold !== actionState.isBold) {
        actionDispatch({ type: "SET_IS_BOLD", payload: isBold });
      }

      const isItalic = currentEditor.isActive("italic");
      if (isItalic !== actionState.isItalic) {
        actionDispatch({ type: "SET_IS_ITALIC", payload: isItalic });
      }

      const isStrike = currentEditor.isActive("strike");
      if (isStrike !== actionState.isStrike) {
        actionDispatch({ type: "SET_IS_STRIKE", payload: isStrike });
      }

      const isUnderline = currentEditor.isActive("underline");
      if (isUnderline !== actionState.isUnderline) {
        actionDispatch({ type: "SET_IS_UNDERLINE", payload: isUnderline });
      }

      const isCode = currentEditor.isActive("code");
      if (isCode !== actionState.isCode) {
        actionDispatch({ type: "SET_IS_CODE", payload: isCode });
      }

      const isAlignLeft = currentEditor.isActive("alignLeft");
      if (isAlignLeft !== actionState.isAlignLeft) {
        actionDispatch({ type: "SET_IS_ALIGN_LEFT", payload: isAlignLeft });
      }

      const isAlignCenter = currentEditor.isActive("alignCenter");
      if (isAlignCenter !== actionState.isAlignCenter) {
        actionDispatch({ type: "SET_IS_ALIGN_CENTER", payload: isAlignCenter });
      }

      const isAlignRight = currentEditor.isActive("alignRight");
      if (isAlignRight !== actionState.isAlignRight) {
        actionDispatch({ type: "SET_IS_ALIGN_RIGHT", payload: isAlignRight });
      }

      const isAlignJustify = currentEditor.isActive("alignJustify");
      if (isAlignJustify !== actionState.isAlignJustify) {
        actionDispatch({
          type: "SET_IS_ALIGN_JUSTIFY",
          payload: isAlignJustify,
        });
      }

      const node = getCurrentNode(changeNodeMenuItems);
      if (
        !selectorState.currentNode ||
        (node && node.title !== selectorState.currentNode.title)
      ) {
        selectorDispatch({ type: "SET_CURRENT_NODE", payload: node });
      }
    };
    if (!editor) return;
    editor.on("selectionUpdate", handler);
    editor.on("update", handler);

    return () => {
      editor.off("selectionUpdate", handler);
      editor.off("update", handler);
    };
  }, [editor, selectorState, actionState, changeNodeMenuItems]);

  if (!editor) {
    return {
      selectorState: initialSelectorState,
      actionState: initialActionState,
    };
  }

  return { selectorState, actionState };
};

export default useEditorState;
