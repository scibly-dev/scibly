import { Separator } from "@scibly/ui/components/separator";
import Link from "next/link";

import { useTranslation } from "@/i18n/hooks/use-translation";

import GoogleButton from "./google-button";

type FormBaseProps = {
  children: React.ReactNode;
  title: string;
  redirectLink: {
    label: string;
    href: string;
    text: string;
  };
};

export const FormBase = ({ children, title, redirectLink }: FormBaseProps) => {
  const { translations } = useTranslation("auth");
  return (
    <>
      <h2 className="text-brand-ink mb-6 text-center text-2xl font-semibold tracking-[-0.02em]">
        {title}
      </h2>
      {children}
      <div className="mt-5 w-full space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">
              {translations.formBase.or}
            </span>
          </div>
        </div>
        <GoogleButton />
      </div>
      <div className="mt-4 text-center text-sm text-gray-500">
        {redirectLink.text}{" "}
        <Link
          href={redirectLink.href}
          className="text-brand-blue decoration-brand-blue/25 hover:text-brand-blue-hover font-medium underline underline-offset-4 transition-colors"
          tabIndex={0}
          aria-label={translations.formBase.signInAriaLabel}
        >
          {redirectLink.label}
        </Link>
      </div>
    </>
  );
};

FormBase.displayName = "FormBase";
export default FormBase;
