"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signUp } from "@scibly/auth/client";
import { getLocale } from "@scibly/i18n";
import { type Locale } from "@scibly/i18n/constants";
import { autocaptureAttributes } from "@scibly/observability/autocapture";
import { REDIRECT_URL_PARAM, routes } from "@scibly/routes";
import {
  createEmailSchema,
  createNameSchema,
  createPasswordSchema,
  createUsernameSchema,
} from "@scibly/schemas/user";
import { Button } from "@scibly/ui/components/button";
import { FormFieldError } from "@scibly/ui/components/form-field-error";
import { Input } from "@scibly/ui/components/input";
import PasswordInput from "@scibly/ui/components/password-input";
import { Loader2 } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { env } from "@/env";
import { useTranslation } from "@/i18n/hooks/use-translation";
import { getRedirectUrl } from "@/lib/get-redirect-url";

const getSignUpSchema = (locale: Locale) =>
  z.object({
    name: createNameSchema(locale),
    email: createEmailSchema(locale),
    username: z.union([z.literal(""), createUsernameSchema(locale)]).optional(),
    password: createPasswordSchema(locale),
  });

type SignUpFormValues = z.infer<ReturnType<typeof getSignUpSchema>>;

type SignUpFormProps = {
  setEmail: React.Dispatch<React.SetStateAction<string>>;
};

function useSignUpForm({ setEmail }: SignUpFormProps) {
  const params = useParams();
  const rawLang = params.lang;
  const langParam = Array.isArray(rawLang) ? rawLang[0] : rawLang;
  const locale = getLocale(langParam, true);
  const signUpSchema = useMemo(() => getSignUpSchema(locale), [locale]);
  const { translations } = useTranslation("auth");
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const successfullLoginRedirectUrl = getRedirectUrl(
    searchParams.get(REDIRECT_URL_PARAM),
    routes.app.auth.callback.login.success,
  );
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", username: "", password: "" },
  });
  const onSubmit = async (data: SignUpFormValues) => {
    setIsLoading(true);
    const lowerCaseEmail = data.email.trim().toLowerCase();
    await signUp.email(
      {
        ...data,
        email: lowerCaseEmail,
        callbackURL: successfullLoginRedirectUrl,
      },
      {
        onSuccess: () => {
          toast.success(translations.signUpForm.successToast);
          setIsLoading(false);
          setEmail(lowerCaseEmail);
        },
        onError: (ctx) => {
          toast.error(ctx.error.message || translations.signUpForm.errorToast);
          setIsLoading(false);
        },
      },
    );
  };
  const isDisabled =
    (env.NEXT_PUBLIC_BETA_FLAG && !env.NEXT_PUBLIC_FREE_ACCESS_FLAG) ||
    isLoading;
  return { form, isDisabled, isLoading, locale, onSubmit, translations };
}

export const SignUpFields = ({
  form,
  locale,
  translations,
  isDisabled,
}: Pick<
  ReturnType<typeof useSignUpForm>,
  "form" | "locale" | "translations" | "isDisabled"
>) => {
  const { errors } = form.formState;
  return (
    <>
      <div className="space-y-2">
        <Input
          id="name"
          placeholder={translations.signUpForm.namePlaceholder}
          {...form.register("name")}
          disabled={isDisabled}
        />
        <FormFieldError error={errors.name} locale={locale} />
      </div>

      <div className="space-y-2">
        <Input
          id="email"
          type="email"
          placeholder={translations.signUpForm.emailPlaceholder}
          {...form.register("email")}
          disabled={isDisabled}
        />
        <FormFieldError error={errors.email} locale={locale} />
      </div>

      <div className="space-y-2">
        <Input
          id="username"
          placeholder={translations.signUpForm.usernamePlaceholder}
          {...form.register("username")}
          disabled={isDisabled}
        />
        <FormFieldError error={errors.username} locale={locale} />
      </div>

      <div className="space-y-2">
        <PasswordInput
          id="password"
          placeholder={translations.signUpForm.passwordPlaceholder}
          {...form.register("password")}
          showValidation={true}
          validationLocale={locale}
          disabled={isDisabled}
        />
        <FormFieldError error={errors.password} locale={locale} />
      </div>
    </>
  );
};

export default function SignUpForm(props: SignUpFormProps) {
  const { form, isDisabled, isLoading, locale, onSubmit, translations } =
    useSignUpForm(props);
  return (
    <div className="w-full space-y-5">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <SignUpFields
          form={form}
          locale={locale}
          translations={translations}
          isDisabled={isDisabled}
        />
        <Button
          type="submit"
          variant="brand"
          className="w-full"
          disabled={isDisabled}
          {...autocaptureAttributes({ action: "signup_submit" })}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {translations.signUpForm.submitting}
            </>
          ) : (
            translations.signUpForm.submit
          )}
        </Button>
      </form>
    </div>
  );
}

SignUpForm.displayName = "SignUpForm";
