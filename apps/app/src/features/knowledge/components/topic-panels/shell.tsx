const Hint = ({ children }: { children: string }) => (
  <p className="text-ink-faint text-[12px]">{children}</p>
);

const Empty = ({ children }: { children: string }) => (
  <p className="text-ink-muted py-6 text-center text-[13px]">{children}</p>
);

const TabCount = ({ children }: { children: number }) => (
  <span className="text-ink-faint ml-1.5 text-[11px] tabular-nums">
    {children}
  </span>
);

export { Empty, Hint, TabCount };
