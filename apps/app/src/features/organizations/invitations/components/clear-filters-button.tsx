"use client";

import { INVITATION_ORG_QUERY_PARAM, routes } from "@scibly/routes";
import { useRouter, useSearchParams } from "next/navigation";

export function ClearFiltersButtonComponent({
  onClear,
  label,
}: {
  onClear: () => void;
  label: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <button
      onClick={() => {
        onClear();
        if (searchParams?.get(INVITATION_ORG_QUERY_PARAM)) {
          router.replace(routes.app.profile.invitations());
        }
      }}
      className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
    >
      {label}
    </button>
  );
}
