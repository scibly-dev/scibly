import { useCallback, useState } from "react";

export function useRestartConfirmation(onConfirmedRestart?: () => void) {
  const [isOpen, setIsOpen] = useState(false);

  const requestRestart = useCallback(() => setIsOpen(true), []);
  const cancel = useCallback(() => setIsOpen(false), []);
  const confirm = useCallback(() => {
    setIsOpen(false);
    onConfirmedRestart?.();
  }, [onConfirmedRestart]);

  return { isOpen, requestRestart, cancel, confirm };
}
