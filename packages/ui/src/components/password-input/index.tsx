"use client";

import type React from "react";

import { defaultLocale, type Locale } from "@scibly/i18n/constants";
import { getPasswordValidationRulesForLocale } from "@scibly/schemas/user";
import { Button } from "@scibly/ui/components/button";
import { cn } from "@scibly/ui/utils";
import { CheckCircle2, EyeIcon, EyeOffIcon, XCircle } from "lucide-react";
import { forwardRef, useEffect, useMemo, useState } from "react";

import { Input } from "../input";

type PasswordValidationRule = {
  id: string;
  label: string;
  validator: (password: string) => boolean;
};

type PasswordInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  id?: string;
  placeholder?: string;
  showValidation?: boolean;

  validationLocale?: Locale;
  validationRules?: PasswordValidationRule[];
  onValidationChange?: (isValid: boolean) => void;
};

const validationHeading = (locale: Locale): string =>
  locale === "en" ? "Password requirements:" : "Passwort-Anforderungen:";

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      id,
      placeholder,
      showValidation = false,
      validationLocale = defaultLocale,
      validationRules,
      onValidationChange,
      className,
      ...props
    },
    ref,
  ) => {
    const resolvedRules = useMemo(
      () =>
        validationRules ??
        getPasswordValidationRulesForLocale(validationLocale),
      [validationRules, validationLocale],
    );

    const [showPassword, setShowPassword] = useState(false);
    const [internalPasswordState, setInternalPasswordState] = useState<string>(
      typeof props.value === "string" ? props.value : "",
    );
    const [validationStatus, setValidationStatus] = useState<
      Record<string, boolean>
    >({});
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
      const newValidationStatus: Record<string, boolean> = {};
      if (internalPasswordState.length === 0) {
        setValidationStatus({});
        return;
      }

      resolvedRules.forEach((rule) => {
        newValidationStatus[rule.id] = rule.validator(
          internalPasswordState || "",
        );
      });

      setValidationStatus(newValidationStatus);

      const isValid = Object.values(newValidationStatus).every(
        (status) => status,
      );
      onValidationChange?.(isValid);
    }, [internalPasswordState, resolvedRules, onValidationChange]);

    return (
      <div className="space-y-2">
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            id={id}
            placeholder={placeholder}
            className={cn("pr-10", className)}
            ref={ref}
            {...props}
            value={internalPasswordState}
            onChange={(e) => {
              setInternalPasswordState(e.target.value);
              props.onChange?.(e);
            }}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOffIcon
                className="h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
            ) : (
              <EyeIcon
                className="h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
            )}
          </Button>
        </div>

        {/* Validation display */}
        {showValidation && (internalPasswordState || isFocused) && (
          <div className="mt-2 rounded-md border border-border bg-muted/30 p-3 text-sm">
            <p className="mb-2 font-medium">
              {validationHeading(validationLocale)}
            </p>
            <ul className="space-y-1">
              {resolvedRules.map((rule) => (
                <li key={rule.id} className="flex items-center gap-2">
                  {validationStatus[rule.id] ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span
                    className={cn(
                      validationStatus[rule.id]
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400",
                    )}
                  >
                    {rule.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
