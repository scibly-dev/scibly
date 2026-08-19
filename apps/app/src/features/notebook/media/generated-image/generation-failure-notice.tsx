"use client";

export function GenerationFailureNotice({
  title,
  errorText,
}: {
  title: string;
  errorText?: string;
}) {
  return (
    <>
      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
        {title}
      </p>
      {errorText ? (
        <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
          {errorText}
        </p>
      ) : null}
    </>
  );
}
