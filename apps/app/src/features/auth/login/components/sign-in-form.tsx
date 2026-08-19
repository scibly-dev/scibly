"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "@scibly/auth/client";
import { getLocale } from "@scibly/i18n";
import { type Locale } from "@scibly/i18n/constants";
import { autocaptureAttributes } from "@scibly/observability/autocapture";
import { REDIRECT_URL_PARAM, routes } from "@scibly/routes";
import { createEmailSchema, createPasswordSchema } from "@scibly/schemas/user";
import { Button } from "@scibly/ui/components/button";
import { FormFieldError } from "@scibly/ui/components/form-field-error";
import { Input } from "@scibly/ui/components/input";
import PasswordInput from "@scibly/ui/components/password-input";
import { Loader2 } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useTranslation } from "@/i18n/hooks/use-translation";
import { getRedirectUrl } from "@/lib/get-redirect-url";

const getSignInSchema = (locale: Locale) =>
  z.object({
    email: createEmailSchema(locale),
    password: createPasswordSchema(locale),
  });

type SignInFormValues = z.infer<ReturnType<typeof getSignInSchema>>;

type SignInFormProps = {
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  setShowPasswordReset: React.Dispatch<React.SetStateAction<boolean>>;
  setVerifyEmail: React.Dispatch<React.SetStateAction<boolean>>;
};

function useSignInForm({
  setEmail,
  setVerifyEmail,
}: Omit<SignInFormProps, "setShowPasswordReset">) {
  const params = useParams();
  const rawLang = params.lang;
  const langParam = Array.isArray(rawLang) ? rawLang[0] : rawLang;
  const locale = getLocale(langParam, true);
  const signInSchema = useMemo(() => getSignInSchema(locale), [locale]);
  const { translations } = useTranslation("auth");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const successfullLoginRedirectUrl = getRedirectUrl(
    searchParams.get(REDIRECT_URL_PARAM),
    routes.app.auth.callback.login.success,
  );
  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });
  const onSubmit = async (data: SignInFormValues) => {
    setIsLoading(true);
    const lowerCaseEmail = data.email.trim().toLowerCase();
    await signIn.email(
      {
        email: lowerCaseEmail,
        password: data.password,
      },
      {
        onSuccess: () => {
          router.push(successfullLoginRedirectUrl);
        },
        onError: (ctx) => {
          if (ctx.error.code === "EMAIL_NOT_VERIFIED") {
            setEmail(lowerCaseEmail);
            setVerifyEmail(true);
          } else if (ctx.error.code === "INVALID_EMAIL_OR_PASSWORD") {
            toast.error(translations.signInForm.invalidEmailOrPassword);
          } else {
            toast.error(ctx.error.message);
          }
          setIsLoading(false);
        },
      },
    );
  };
  return { form, isLoading, locale, onSubmit, translations };
}

export default function SignInForm(props: SignInFormProps) {
  const { setShowPasswordReset } = props;
  const { form, isLoading, locale, onSubmit, translations } =
    useSignInForm(props);
  return (
    <div className="w-full space-y-5">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Input
            id="email"
            type="email"
            placeholder={translations.signInForm.emailPlaceholder}
            {...form.register("email")}
            disabled={isLoading}
          />
          <FormFieldError error={form.formState.errors.email} locale={locale} />
        </div>

        <div className="space-y-2">
          <PasswordInput
            id="password"
            placeholder={translations.signInForm.passwordPlaceholder}
            {...form.register("password")}
            disabled={isLoading}
          />
          <FormFieldError
            error={form.formState.errors.password}
            locale={locale}
          />
        </div>

        <Button
          type="submit"
          variant="brand"
          className="w-full"
          disabled={isLoading}
          {...autocaptureAttributes({ action: "login_submit" })}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {translations.signInForm.submitting}
            </>
          ) : (
            translations.signInForm.submit
          )}
        </Button>
      </form>
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setShowPasswordReset(true)}
          className="hover:text-brand-blue text-sm text-gray-500 transition-colors"
          {...autocaptureAttributes({ action: "login_forgot_password" })}
        >
          {translations.signInForm.forgotPassword}
        </button>
      </div>
    </div>
  );
}

SignInForm.displayName = "SignInForm";
