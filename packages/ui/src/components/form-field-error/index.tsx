"use client";

import type { Locale } from "@scibly/i18n/constants";

import {
  formatFieldErrorMessage,
  type RhfLikeFieldError,
} from "@scibly/schemas/zod-i18n";

import { cn } from "../../utils/cn";

type FormFieldErrorProps = {
  error: RhfLikeFieldError;
  locale: Locale;
  translate?: (raw: string) => string | undefined;
  fallbackDe?: string;
  id?: string;
  className?: string;
};

export const FormFieldError = ({
  error,
  locale,
  translate,
  fallbackDe,
  id,
  className,
}: FormFieldErrorProps) => {
  const text = formatFieldErrorMessage(error, {
    locale,
    translate,
    fallbackDe,
  });

  if (!text) {
    return null;
  }

  return (
    <p
      id={id}
      role="alert"
      className={cn("text-sm text-destructive", className)}
    >
      {text}
    </p>
  );
};
