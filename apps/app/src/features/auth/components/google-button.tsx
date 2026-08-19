"use client";

import { signIn } from "@scibly/auth/client";
import { autocaptureAttributes } from "@scibly/observability/autocapture";
import { routes } from "@scibly/routes";
import { REDIRECT_URL_PARAM } from "@scibly/routes";
import { Button } from "@scibly/ui/components/button";
import { cn } from "@scibly/ui/utils";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { env } from "@/env";
import { useTranslation } from "@/i18n/hooks/use-translation";
import { getRedirectUrl } from "@/lib/get-redirect-url";

export const GoogleSvg = () => {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
      <path d="M1 1h22v22H1z" fill="none" />
    </svg>
  );
};
GoogleSvg.displayName = "GoogleSvg";

type GoogleButtonProps = {
  handleGoogleSignIn?: () => void;
  setIsLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  className?: string;
};

export const GoogleButton = ({
  handleGoogleSignIn,
  setIsLoading,
  className,
}: GoogleButtonProps) => {
  const { translations } = useTranslation("auth");
  const [internalIsLoading, setInternalIsLoading] = useState(false);

  const changeLoadingState = (state: boolean) => {
    setInternalIsLoading(state);
    setIsLoading?.(state);
  };

  const searchParams = useSearchParams();
  const successfullLoginRedirectUrl = getRedirectUrl(
    searchParams?.get(REDIRECT_URL_PARAM),
    routes.app.auth.callback.login.success,
  );

  const handleInternalGoogleSignIn = async () => {
    handleGoogleSignIn?.();
    changeLoadingState(true);
    await signIn.social(
      {
        provider: "google",
        callbackURL: successfullLoginRedirectUrl,
      },
      {
        onError: (ctx) => {
          console.error(ctx.error.message);
          toast.error(translations.googleButton.signInError);
        },
      },
    );
    changeLoadingState(false);
  };
  return (
    <Button
      variant="outline"
      type="button"
      className={cn("w-full font-normal", className)}
      onClick={handleInternalGoogleSignIn}
      disabled={
        (env.NEXT_PUBLIC_BETA_FLAG && !env.NEXT_PUBLIC_FREE_ACCESS_FLAG) ||
        internalIsLoading
      }
      {...autocaptureAttributes({ action: "google_sign_in" })}
    >
      <GoogleSvg />
      {translations.googleButton.continueWithGoogle}
    </Button>
  );
};
GoogleButton.displayName = "GoogleButton";
export default GoogleButton;
