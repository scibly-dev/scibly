import type { KnowledgeTranslations } from "../../contracts";
import type { Option } from "./contracts";

import { X } from "lucide-react";

export function Chips({
  t,
  values,
  onRemove,
}: {
  t: KnowledgeTranslations;
  values: Option[];
  onRemove: (id: string) => void;
}) {
  if (values.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((value) => (
        <span
          key={value.id}
          className="border-edge text-ink flex items-center gap-1 rounded-full border py-0.5 pr-1 pl-2.5 text-[12px]"
        >
          <span className="truncate">{value.label}</span>
          <button
            type="button"
            onClick={() => onRemove(value.id)}
            aria-label={t.form.remove.replace("{name}", value.label)}
            className="text-ink-faint hover:text-ink"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </span>
      ))}
    </div>
  );
}
