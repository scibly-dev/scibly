import type { NodeViewProps } from "@tiptap/react";
import type { icons } from "lucide-react";

import Icon from "@scibly/ui/components/icon";
import { Switch } from "@scibly/ui/components/switch";
import { cn } from "@scibly/ui/utils";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";

import { useTranslation } from "@/i18n/hooks/use-translation";
import { updateQuestionAttributes } from "@/shared/content/editor/blocks/attributes/default-question-block-attributes";
import { getNodeAttributes } from "@/shared/content/editor/blocks/attributes/get-default-react-block-attributes";

export const BlockSettingsContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={cn("flex flex-col gap-0.5", className)}>{children}</div>;

export const BlockSettingsSwitch = ({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) => (
  <label className="hover:bg-ground flex cursor-pointer items-center justify-between rounded-[10px] px-2 py-1.5 transition-colors dark:hover:bg-neutral-800">
    <span className="text-ink text-[14px] dark:text-neutral-300">{label}</span>
    <Switch checked={checked} onCheckedChange={onCheckedChange} />
  </label>
);

export const BlockSettingsNumberInput = ({
  label,
  value,
  onChange,
  min = 0,
  step = 1,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
  suffix?: string;
}) => (
  <div className="hover:bg-ground flex items-center justify-between gap-3 rounded-[10px] px-2 py-1.5 transition-colors dark:hover:bg-neutral-800">
    <span className="text-ink shrink-0 text-[14px] dark:text-neutral-300">
      {label}
    </span>
    <div className="group relative flex w-20 items-center justify-end">
      <input
        type="number"
        min={min}
        step={step}
        defaultValue={value}
        onBlur={(e) =>
          onChange(Math.max(min, parseInt(e.target.value, 10) || 0))
        }
        className="text-ink-muted hover:text-ink focus:text-ink h-6 w-full bg-transparent pr-6 text-right text-[14px] font-medium transition-colors outline-none dark:text-neutral-400 dark:hover:text-neutral-100 dark:focus:text-neutral-100"
      />
      {suffix && (
        <span className="pointer-events-none absolute top-1/2 right-0 -translate-y-1/2 text-[12px] font-bold text-amber-500 opacity-80 transition-opacity group-hover:opacity-100">
          {suffix}
        </span>
      )}
    </div>
  </div>
);

export const BlockSettingsSeparator = () => (
  <div className="bg-hairline my-1 h-px w-full dark:bg-neutral-800" />
);

export const BlockSettingsAction = ({
  icon,
  label,
  shortcut,
  onClick,
  destructive,
  disabled,
}: {
  icon: keyof typeof icons;
  label: string;
  shortcut?: string;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full cursor-pointer items-center gap-3 rounded-[10px] px-2 py-1.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        destructive
          ? "text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
          : "text-ink hover:bg-ground dark:text-neutral-300 dark:hover:bg-neutral-800",
      )}
    >
      <Icon name={icon} className="h-4 w-4 opacity-70" />
      <span className="flex-1 text-[14px]">{label}</span>
      {shortcut && (
        <span className="text-ink-faint text-[12px] dark:text-neutral-500">
          {shortcut}
        </span>
      )}
    </button>
  );
};

export const BlockSettingsFooter = ({
  nodeViewProps,
}: {
  nodeViewProps: NodeViewProps;
}) => {
  const { translations } = useTranslation("editorUi");

  const attrs = getNodeAttributes(nodeViewProps.node);
  const isQuestionBlock = attrs.isQuestionBlock;

  const handleDelete = useCallback(() => {
    nodeViewProps.deleteNode();
  }, [nodeViewProps]);

  const handleCopy = useCallback(() => {
    const { getPos, editor } = nodeViewProps;
    const pos = getPos();
    if (typeof pos !== "number") return;
    editor.chain().setNodeSelection(pos).run();
    document.execCommand("copy");
    toast.success(translations.blockOptions.copiedSuccess);
  }, [nodeViewProps, translations.blockOptions.copiedSuccess]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        handleDelete();
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "c") {
        e.preventDefault();
        handleCopy();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleDelete, handleCopy]);

  return (
    <>
      <BlockSettingsSeparator />
      {isQuestionBlock && (
        <>
          <BlockSettingsNumberInput
            label={translations.blockOptions.spLabel || "SP Belohnung"}
            value={attrs.questionBlockAttributes?.sp ?? 0}
            onChange={(value) =>
              updateQuestionAttributes(nodeViewProps, { sp: value })
            }
            suffix="SP"
            min={1}
          />
          <BlockSettingsSeparator />
        </>
      )}
      <BlockSettingsAction
        icon="Trash2"
        label={translations.blockOptions.delete || "Delete"}
        shortcut="Del"
        onClick={handleDelete}
        destructive
      />
      <BlockSettingsAction
        icon="Copy"
        label={translations.blockOptions.duplicate || "Copy"}
        shortcut="⌘ C"
        onClick={handleCopy}
      />
    </>
  );
};
