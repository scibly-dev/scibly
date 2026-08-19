import { useEffect, useState } from "react";

const readOnline = () =>
  typeof navigator !== "undefined" ? navigator.onLine : undefined;

export default function useNetworkState() {
  const [online, setOnline] = useState(readOnline);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);

    window.addEventListener("online", update, { passive: true });
    window.addEventListener("offline", update, { passive: true });

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return { online };
}
