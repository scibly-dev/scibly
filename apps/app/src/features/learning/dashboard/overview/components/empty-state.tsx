interface EmptyStateProps {
  icon: React.ReactNode;
  message: string;
}

export function EmptyState({ icon, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/50 py-10 text-center dark:border-neutral-800 dark:bg-neutral-900/30">
      {icon}
      <p className="text-muted-foreground max-w-[220px] text-[13px]">
        {message}
      </p>
    </div>
  );
}
