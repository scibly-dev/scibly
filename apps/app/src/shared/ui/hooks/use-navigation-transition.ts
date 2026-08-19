"use client";

import { useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";

// Wrapping router.push in a transition keeps isNavigating true until the new route is on screen, not just until push() returns.
export function useNavigationTransition() {
  const router = useRouter();
  const [isNavigating, startNavigation] = useTransition();

  const navigate = useCallback(
    (href: string) => {
      startNavigation(() => {
        router.push(href);
      });
    },
    [router],
  );

  return { isNavigating, navigate };
}
