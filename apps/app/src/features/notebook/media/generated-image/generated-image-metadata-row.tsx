interface GeneratedImageMetadataRowProps {
  label: string;
  value?: string;
}

export function GeneratedImageMetadataRow({
  label,
  value,
}: GeneratedImageMetadataRowProps) {
  if (!value) return null;

  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[10px] font-semibold tracking-wide text-neutral-400 uppercase dark:text-neutral-500">
        {label}
      </dt>
      <dd className="text-xs leading-relaxed wrap-break-word text-neutral-700 dark:text-neutral-200">
        {value}
      </dd>
    </div>
  );
}
