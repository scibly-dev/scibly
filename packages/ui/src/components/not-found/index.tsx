import { routes } from "@scibly/routes";
import { Button } from "@scibly/ui/components/button";
import Link from "next/link";

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col gap-16 text-center">
        <div className="relative">
          <h1 className="text-3d text-6xl">404</h1>
        </div>
        <div>
          <h1 className="mb-4 text-4xl font-bold">
            Oops! Seite nicht gefunden
          </h1>
          <p className="mb-8 text-xl">
            Es scheint, als hättest du dich in unbekannte Gebiete verirrt!
          </p>
          <Button asChild>
            <Link href={routes.web.base.home}>Zur Startseite</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
NotFound.displayName = "NotFound";
