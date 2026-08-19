"use client";
import { routes } from "@scibly/routes";
import { Button } from "@scibly/ui/components/button";
import Link from "next/link";

export function GlobalError() {
  return (
    <html className="flex min-h-screen flex-col items-center justify-center p-4">
      <body className="flex w-full max-w-md flex-col gap-16 text-center">
        <div className="relative">
          <h1 className="text-3d">Fehler</h1>
        </div>
        <div>
          <h1 className="mb-4 text-4xl font-bold">
            Oops! Ein unerwarteter Fehler ist aufgetreten
          </h1>
          <p className="mb-8 text-xl">Bitte versuche es später erneut.</p>
          <Button asChild>
            <Link href={routes.web.base.home}>Zur Startseite</Link>
          </Button>
        </div>
      </body>
    </html>
  );
}
GlobalError.displayName = "GlobalError";
