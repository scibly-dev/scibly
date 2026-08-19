"use client";

import { Button } from "@scibly/ui/components/button";
import { cn } from "@scibly/ui/utils";
import { Loader2 } from "lucide-react";

type SettingsCardProps = {
  title: React.ReactNode;
  description: React.ReactNode;
  footer?: React.ReactNode;
  saveButtonText?: string;
  onSave?: () => void;
  isPending?: boolean;
  isDirty?: boolean;
  contentLayout?: "column" | "row";
  variant?: "default" | "destructive";
  children?: React.ReactNode;
  className?: string;
};

export const SettingsCardContent = ({
  title,
  description,
  contentLayout = "column",
  children,
}: Pick<
  SettingsCardProps,
  "children" | "contentLayout" | "description" | "title"
>) => {
  return (
    <div
      className={cn(
        "flex p-6",
        contentLayout === "row"
          ? "flex-row items-center justify-between"
          : "flex-col gap-4",
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-1",
          contentLayout === "row" ? "max-w-[70%]" : undefined,
        )}
      >
        <h3 className="text-foreground text-[16px] font-semibold tracking-tight">
          {title}
        </h3>
        <p className="text-muted-foreground text-[14px]">{description}</p>
      </div>
      {children && <div>{children}</div>}
    </div>
  );
};

export const SettingsCardFooter = ({
  footer,
  isDirty,
  isPending,
  onSave,
  saveButtonText,
  variant,
}: Pick<
  SettingsCardProps,
  "footer" | "isDirty" | "isPending" | "onSave" | "saveButtonText" | "variant"
>) => {
  const isDestructive = variant === "destructive";
  const canSave = isDirty !== false && !isPending;

  return (
    <div
      className={cn(
        "flex items-center rounded-b-[18px] border-t-2 px-6 py-4",
        footer ? "justify-between" : "justify-end",
        isDestructive
          ? "border-red-200/60 bg-red-50/50 dark:border-red-900/40 dark:bg-red-900/10"
          : "border-edge bg-ground",
      )}
    >
      {footer && <p className="text-muted-foreground text-[13px]">{footer}</p>}
      {saveButtonText && onSave ? (
        <Button
          onClick={onSave}
          disabled={!canSave}
          variant={isDestructive ? "destructive" : "default"}
          size="sm"
          className="h-9 gap-2 px-5"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {saveButtonText}
        </Button>
      ) : null}
    </div>
  );
};

export function SettingsCard(props: SettingsCardProps) {
  const isDestructive = props.variant === "destructive";

  return (
    <div
      className={cn(
        "flex flex-col rounded-[20px] border-2 bg-white shadow-[0_4px_0_0_var(--color-lip)] dark:bg-neutral-900/80",
        isDestructive
          ? "border-red-200/60 dark:border-red-900/40"
          : "border-hairline dark:border-neutral-800/60",
        props.className,
      )}
    >
      <SettingsCardContent
        title={props.title}
        description={props.description}
        contentLayout={props.contentLayout}
      >
        {props.children}
      </SettingsCardContent>
      <SettingsCardFooter
        footer={props.footer}
        saveButtonText={props.saveButtonText}
        onSave={props.onSave}
        isPending={props.isPending}
        isDirty={props.isDirty}
        variant={props.variant}
      />
    </div>
  );
}
