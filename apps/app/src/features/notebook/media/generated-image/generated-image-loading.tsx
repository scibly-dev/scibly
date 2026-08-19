interface GeneratedImageLoadingProps {
  label: string;
}

export function GeneratedImageLoading({ label }: GeneratedImageLoadingProps) {
  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0 bg-[#f3f3f4] dark:bg-[#171717]"
      />
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2.5">
        <span aria-hidden className="inline-flex items-center gap-1.5">
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className="h-2 w-2 animate-pulse rounded-full bg-neutral-400 dark:bg-neutral-500"
              style={{ animationDelay: `${index * 160}ms` }}
            />
          ))}
        </span>
        <p className="text-[13px] font-medium tracking-tight text-neutral-500 dark:text-neutral-400">
          {label}
        </p>
      </div>
    </>
  );
}
