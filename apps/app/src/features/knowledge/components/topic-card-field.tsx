export function TopicCardField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-ink-faint text-[11px] font-semibold tracking-wider uppercase">
        {label}
      </dt>
      <dd className="text-ink-muted mt-0.5 text-[13px]">{children}</dd>
    </div>
  );
}
