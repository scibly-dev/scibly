import { useEffect, useState } from "react";

export function useSyncedState<T>(initialData: T, queryData: T | undefined) {
  const [state, setState] = useState<T>(initialData);

  useEffect(() => {
    if (queryData !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState(queryData);
    }
  }, [queryData]);

  return [state, setState] as const;
}
