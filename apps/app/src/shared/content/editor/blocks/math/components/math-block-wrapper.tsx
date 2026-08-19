"use client";

import type { NodeViewProps } from "@tiptap/core";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@scibly/ui/components/popover";
import { cn } from "@scibly/ui/utils";
import { Sigma } from "lucide-react";
import { useEffect, useState } from "react";
import { BlockMath, InlineMath } from "react-katex";
import Editor from "react-simple-code-editor";

import { useTranslation } from "@/i18n/hooks/use-translation";
import { getNodeAttributes } from "@/shared/content/editor/blocks/attributes/get-default-react-block-attributes";
import Prism from "@/shared/content/editor/blocks/code/prism/prism";
import { getGrammar } from "@/shared/content/editor/blocks/code/prism/prismUtils";
import { type _MathBlockAttributes } from "@/shared/content/editor/blocks/math/utils/math-block-attributes";
import isBlockEditable from "@/shared/content/editor/runtime/is-block-editable";

export {
  type _MathBlockAttributes,
  defaultData,
  type DefaultDataType,
} from "@/shared/content/editor/blocks/math/utils/math-block-attributes";

type MathBlockWrapperProps = {
  nodeViewProps: NodeViewProps;
  type: "inline" | "block";
  emptyFormulaBlockClassName?: string;
  formulaWrapperClassName?: string;
};

const getHoverAnimation = (isEditable: boolean, isWrapper: boolean) => {
  const base = "transition-all duration-200 rounded-xl";
  if (isEditable) {
    if (isWrapper) {
      return cn(base, "hover:bg-neutral-100 dark:hover:bg-neutral-800/50");
    } else {
      return cn(
        base,
        "bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 group-hover:bg-neutral-100 dark:group-hover:bg-neutral-800/50 shadow-sm",
      );
    }
  }

  return "";
};

export const MathBlockWrapper = ({
  nodeViewProps,
  type,
  emptyFormulaBlockClassName,
  formulaWrapperClassName,
}: MathBlockWrapperProps) => {
  const { translations } = useTranslation("editorUi");
  const [open, setOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const attrs = getNodeAttributes<_MathBlockAttributes>(nodeViewProps.node);
  const formula = attrs.formula;
  const MathComponent = type === "inline" ? InlineMath : BlockMath;
  const WrappingElementComponent = type === "inline" ? "span" : "div";

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady || formula.trim() !== "") return;
    setTimeout(() => setOpen(true), 100);
  }, [formula, isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild={type === "block"}>
        <WrappingElementComponent
          className={cn(
            "group relative items-center rounded-xl px-2 py-1",
            type === "block" ? "flex w-full justify-center" : "inline-flex",
            getHoverAnimation(nodeViewProps.editor.isEditable, true),
            formulaWrapperClassName,
            nodeViewProps.editor.isEditable
              ? "cursor-pointer"
              : "cursor-default",
          )}
        >
          {formula?.trim() ? (
            <>
              <span className="pointer-events-none">
                <MathComponent
                  math={formula}
                  renderError={(error) => {
                    const message =
                      `${translations.math.invalidEquationPrefix} ` +
                      error.message.split("error: ")[1];
                    return <span className="text-red-500">{message}</span>;
                  }}
                />
              </span>
              <span className="absolute inset-0 h-auto" />
            </>
          ) : (
            <WrappingElementComponent
              className={cn(
                "mx-1 flex items-center justify-center rounded-xl border-none p-1 px-3 py-1 text-sm font-medium text-neutral-500 outline-none dark:text-neutral-400",
                getHoverAnimation(nodeViewProps.editor.isEditable, false),
                emptyFormulaBlockClassName,
              )}
            >
              <span className="flex items-center justify-center gap-1.5">
                <Sigma className="h-4 w-4 outline-none" />{" "}
                {translations.math.enterFormula}
              </span>
            </WrappingElementComponent>
          )}
        </WrappingElementComponent>
      </PopoverTrigger>
      {nodeViewProps.editor.isEditable && (
        <PopoverContent
          className="max-h-96 w-96 overflow-y-auto p-1"
          align="start"
        >
          <Editor
            value={formula ?? ""}
            readOnly={
              !isBlockEditable(
                nodeViewProps.editor.isEditable,
                nodeViewProps.node,
              )
            }
            spellCheck={false}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                setOpen(false);
                nodeViewProps.editor.commands.focus();
                return;
              }
              if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                return;
              }
            }}
            onValueChange={(formula) =>
              nodeViewProps.updateAttributes({ formula })
            }
            highlight={(formula) =>
              Prism.highlight(formula, getGrammar("LaTeX"), "LaTeX")
            }
            padding={10}
            style={{
              fontFamily: '"Fira code", "Fira Mono", monospace',
            }}
            textareaClassName="border-none outline-none ring-0"
            placeholder={translations.math.formulaPlaceholder}
          />
        </PopoverContent>
      )}
    </Popover>
  );
};

MathBlockWrapper.displayName = "MathBlockWrapper";
export default MathBlockWrapper;
