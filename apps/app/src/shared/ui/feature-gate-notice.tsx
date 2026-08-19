import type { ReactNode } from "react";

export function FeatureGateNotice({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
      {title ? <p className="font-medium">{title}</p> : null}
      {description ? (
        <p className="mt-1 leading-relaxed">{description}</p>
      ) : null}
      {children}
    </div>
  );
}
