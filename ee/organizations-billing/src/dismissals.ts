const listeners = new Set<() => void>();

export const dismissalKey = (
  orgSlug: string,
  periodKey: string,
  threshold: number,
): string => `scibly:allowance-warning:${orgSlug}:${periodKey}:${threshold}`;

export const subscribeToDismissals = (onChange: () => void) => {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
};

export const isDismissed = (key: string): boolean =>
  window.localStorage.getItem(key) === "1";

export const recordDismissal = (key: string) => {
  window.localStorage.setItem(key, "1");
  for (const notify of listeners) notify();
};
