"use client";

import type * as z from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { resetPassword } from "@scibly/auth/client";
import { getLocale } from "@scibly/i18n";
import { autocaptureAttributes } from "@scibly/observability/autocapture";
import { routes } from "@scibly/routes";
import { createResetPasswordWithConfirmationSchema } from "@scibly/schemas/user";
import { Button } from "@scibly/ui/components/button";
import { FormFieldError } from "@scibly/ui/components/form-field-error";
import PasswordInput from "@scibly/ui/components/password-input";
import { Loader2 } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { env } from "@/env";
import { useTranslation } from "@/i18n/hooks/use-translation";

type ResetPasswordFormValues = z.infer<
  ReturnType<typeof createResetPasswordWithConfirmationSchema>
>;

function useResetPasswordForm() {
  const routeParams = useParams();
  const rawLang = routeParams.lang;
  const langParam = Array.isArray(rawLang) ? rawLang[0] : rawLang;
  const locale = getLocale(langParam, true);
  const resetPasswordSchema = useMemo(
    () => createResetPasswordWithConfirmationSchema(locale),
    [locale],
  );
  const { translations } = useTranslation("auth");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) return;
    setIsLoading(true);
    await resetPassword(
      {
        newPassword: data.password,
        token,
      },
      {
        onSuccess: () => {
          toast.success(translations.resetPasswordPage.successToast);
          router.push(routes.app.auth.default);
          setIsLoading(false);
        },
        onError: (ctx) => {
          toast.error(
            ctx.error.message || translations.resetPasswordPage.errorToast,
          );
          setIsLoading(false);
        },
      },
    );
  };
  return { form, isLoading, locale, onSubmit, translations };
}

export const ResetPasswordFields = ({
  form,
  isLoading,
  locale,
  translations,
}: ReturnType<typeof useResetPasswordForm>) => {
  const isConfirmationDisabled =
    (env.NEXT_PUBLIC_BETA_FLAG && !env.NEXT_PUBLIC_FREE_ACCESS_FLAG) ||
    isLoading;
  return (
    <>
      <div className="space-y-2">
        <PasswordInput
          id="password"
          placeholder={translations.resetPasswordPage.passwordPlaceholder}
          {...form.register("password")}
          disabled={isLoading}
          showValidation={true}
          validationLocale={locale}
        />
        <FormFieldError
          error={form.formState.errors.password}
          locale={locale}
        />
      </div>
      <div className="space-y-2">
        <PasswordInput
          id="confirmPassword"
          placeholder={
            translations.resetPasswordPage.confirmPasswordPlaceholder
          }
          {...form.register("confirmPassword")}
          disabled={isConfirmationDisabled}
          showValidation={true}
          validationLocale={locale}
        />
        <FormFieldError
          error={form.formState.errors.confirmPassword}
          locale={locale}
        />
      </div>
    </>
  );
};

export const ResetPasswordScreen = () => {
  const formState = useResetPasswordForm();
  const { form, isLoading, onSubmit, translations } = formState;
  return (
    <div className="w-full space-y-5">
      <h2 className="text-center text-2xl font-bold">
        {translations.resetPasswordPage.title}
      </h2>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <ResetPasswordFields {...formState} />
        <Button
          type="submit"
          variant="brand"
          className="w-full"
          disabled={isLoading}
          {...autocaptureAttributes({ action: "reset_password_submit" })}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {translations.resetPasswordPage.submitting}
            </>
          ) : (
            translations.resetPasswordPage.submit
          )}
        </Button>
      </form>
    </div>
  );
};
ResetPasswordScreen.displayName = "ResetPasswordScreen";
