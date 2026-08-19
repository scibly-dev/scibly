import type {
  AnchorRect,
  SlashCommandStorage,
} from "@/shared/content/editor/extensions/slash-command/types";

import { computePosition, offset, shift } from "@floating-ui/dom";
import { type Editor, Extension } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import { ReactRenderer } from "@tiptap/react";
import Suggestion, {
  type SuggestionKeyDownProps,
  type SuggestionProps,
} from "@tiptap/suggestion";

import { getLocalizedGroups } from "@/shared/content/editor/extensions/slash-command/commands/groups";
import CommandsList from "@/shared/content/editor/extensions/slash-command/components/commands-list";

let popupElement: HTMLDivElement | null = null;
const getEditorLocale = () => {
  if (typeof window === "undefined") return "de" as const;
  return window.location.pathname.startsWith("/en")
    ? ("en" as const)
    : ("de" as const);
};

const ZERO_RECT: AnchorRect = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

const extensionName = "slashCommand";
const extensionPluginKey = new PluginKey(extensionName);

declare module "@tiptap/core" {
  interface Storage {
    slashCommand: SlashCommandStorage;
  }
}

export default Extension.create<any, SlashCommandStorage>({
  name: extensionName,

  priority: 200,

  onCreate() {
    if (!popupElement) {
      popupElement = document.createElement("div");
      popupElement.className = "slash-command-popup";
      Object.assign(popupElement.style, {
        position: "fixed",
        top: "0",
        left: "0",
        zIndex: "9999",
        visibility: "hidden",
        opacity: "0",
        transition: "opacity 0.2s ease-in-out",
        pointerEvents: "auto",
      });
      document.body.appendChild(popupElement);
    }

    if (!this.editor.isEditable) {
      this.editor.storage.slashCommand.hideAiCommands = true;
    } else {
      this.editor.storage.slashCommand.hideAiCommands = false;
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: "/",
        allowSpaces: true,
        pluginKey: extensionPluginKey,
        allow: () => {
          return true;
        },

        command: ({ editor, props }: { editor: Editor; props: any }) => {
          const { view, state } = editor;
          const { $head, $from } = view.state.selection;
          const end = $from.pos;
          const from = $head?.nodeBefore
            ? end -
              ($head.nodeBefore.text?.substring(
                $head.nodeBefore.text?.indexOf("/"),
              ).length ?? 0)
            : $from.start();
          const tr = state.tr.deleteRange(from, end);
          view.dispatch(tr);

          props.action(editor);
          view.focus();
        },

        items: ({ query }: { query: string }) => {
          const hideAiCommands =
            this.editor.storage.slashCommand?.hideAiCommands ?? false;
          const groups = getLocalizedGroups(getEditorLocale(), hideAiCommands);
          const withFilteredCommands = groups.map((group) => ({
            ...group,
            commands: group.commands
              .filter((item) => {
                const labelNormalized = item.label.toLowerCase().trim();
                const queryNormalized = query.toLowerCase().trim();

                if (labelNormalized.includes(queryNormalized)) return true;

                if (item.aliases) {
                  const aliases = item.aliases.map((alias) =>
                    alias.toLowerCase().trim(),
                  );

                  return aliases.includes(queryNormalized);
                }

                return false;
              })
              .filter((command) =>
                command.shouldBeHidden
                  ? !command.shouldBeHidden(this.editor)
                  : true,
              ),
          }));
          const withoutEmptyGroups = withFilteredCommands.filter((group) => {
            if (group.commands.length > 0) {
              return true;
            }

            return false;
          });

          const withEnabledSettings = withoutEmptyGroups.map((group) => ({
            ...group,
            commands: group.commands.map((command) => ({
              ...command,
              isEnabled: true,
            })),
          }));

          return withEnabledSettings;
        },
        render: () => {
          let component: ReactRenderer | null = null;
          let scrollHandler: (() => void) | null = null;
          let isShown = false;
          let latestGetRect: (() => AnchorRect) | null = null;

          const updatePosition = () => {
            if (!popupElement || !isShown || !latestGetRect) return;

            const rect = latestGetRect();
            const virtualEl = {
              getBoundingClientRect: () => rect,
            };

            computePosition(virtualEl, popupElement, {
              placement: "bottom-start",
              strategy: "fixed",
              middleware: [
                offset({ mainAxis: 8, crossAxis: 16 }),
                shift({ padding: 8 }),
              ],
            }).then(({ x, y }) => {
              if (popupElement && isShown) {
                Object.assign(popupElement.style, {
                  left: `${x}px`,
                  top: `${y}px`,
                });
              }
            });
          };

          return {
            onStart: (props: SuggestionProps) => {
              component = new ReactRenderer(CommandsList, {
                props,
                editor: props.editor,
              });

              const { view } = props.editor;

              latestGetRect = () => {
                if (!props.clientRect) {
                  return props.editor.storage.slashCommand.rect;
                }
                const rect = props.clientRect();
                if (!rect) {
                  return props.editor.storage.slashCommand.rect;
                }

                let yPos = rect.y;
                if (
                  component &&
                  rect.top + component.element.offsetHeight + 40 >
                    window.innerHeight
                ) {
                  const diff =
                    rect.top +
                    component.element.offsetHeight -
                    window.innerHeight +
                    40;
                  yPos = rect.y - diff;
                }

                return new DOMRect(rect.x, yPos, rect.width, rect.height);
              };

              scrollHandler = () => {
                updatePosition();
              };

              view.dom.parentElement?.addEventListener("scroll", scrollHandler);

              if (popupElement && component.element) {
                popupElement.innerHTML = "";
                popupElement.appendChild(component.element);
                isShown = true;
                popupElement.style.visibility = "visible";
                popupElement.style.opacity = "1";
                updatePosition();
              }
            },

            onUpdate(props: SuggestionProps) {
              if (component) {
                component.updateProps(props);
              }

              latestGetRect = () => {
                if (!props.clientRect) {
                  return props.editor.storage.slashCommand.rect;
                }
                const rect = props.clientRect();
                if (!rect) {
                  return props.editor.storage.slashCommand.rect;
                }
                return new DOMRect(rect.x, rect.y, rect.width, rect.height);
              };

              props.editor.storage.slashCommand.rect = props.clientRect
                ? latestGetRect()
                : ZERO_RECT;

              updatePosition();
            },

            onKeyDown(props: SuggestionKeyDownProps) {
              if (props.event.key === "Escape") {
                if (popupElement) {
                  isShown = false;
                  popupElement.style.visibility = "hidden";
                  popupElement.style.opacity = "0";
                }
                return true;
              }

              if (!isShown && popupElement) {
                isShown = true;
                popupElement.style.visibility = "visible";
                popupElement.style.opacity = "1";
                updatePosition();
              }

              // @ts-expect-error - ref is private/internal but commonly accessed in tiptap
              return component?.ref?.onKeyDown(props) ?? false;
            },

            onExit(props: SuggestionProps) {
              if (popupElement) {
                isShown = false;
                popupElement.style.visibility = "hidden";
                popupElement.style.opacity = "0";
              }

              if (scrollHandler) {
                const { view } = props.editor;
                view.dom.parentElement?.removeEventListener(
                  "scroll",
                  scrollHandler,
                );
              }

              component?.destroy();
              component = null;
            },
          };
        },
      }),
    ];
  },

  addStorage() {
    return {
      rect: ZERO_RECT,

      hideAiCommands: false,
    };
  },
});
