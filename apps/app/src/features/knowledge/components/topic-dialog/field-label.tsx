import { Label } from "@scibly/ui/components/label";

export function FieldLabel({
  children,
  optional,
  htmlFor,
}: {
  children: string;
  optional?: string;
  htmlFor?: string;
}) {
  return (
    <Label htmlFor={htmlFor} className="flex items-baseline gap-1.5">
      {children}
      {optional ? (
        <span className="text-ink-faint text-[11px] font-normal">
          {optional}
        </span>
      ) : (
        <span className="text-destructive" aria-hidden="true">
          *
        </span>
      )}
    </Label>
  );
}
