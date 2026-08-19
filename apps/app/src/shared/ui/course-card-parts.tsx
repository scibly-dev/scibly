import { keyShadowClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import { BookOpen } from "lucide-react";
import Image from "next/image";
import { type ReactNode } from "react";

const COVER_TONES = [
  {
    panel:
      "bg-blue-50 border-blue-200 shadow-[0_4px_0_0_var(--color-blue-200)]",
    tile: "bg-blue-200 text-blue-700 shadow-[0_3px_0_0_var(--color-blue-400)]",
  },
  {
    panel:
      "bg-emerald-50 border-emerald-200 shadow-[0_4px_0_0_var(--color-emerald-200)]",
    tile: "bg-emerald-200 text-emerald-800 shadow-[0_3px_0_0_var(--color-emerald-400)]",
  },
  {
    panel:
      "bg-green-50 border-green-200 shadow-[0_4px_0_0_var(--color-green-200)]",
    tile: "bg-green-200 text-green-700 shadow-[0_3px_0_0_var(--color-green-400)]",
  },
  {
    panel:
      "bg-orange-50 border-orange-200 shadow-[0_4px_0_0_var(--color-orange-200)]",
    tile: "bg-orange-200 text-orange-700 shadow-[0_3px_0_0_var(--color-orange-400)]",
  },
  {
    panel:
      "bg-purple-50 border-purple-200 shadow-[0_4px_0_0_var(--color-purple-200)]",
    tile: "bg-purple-200 text-purple-700 shadow-[0_3px_0_0_var(--color-purple-400)]",
  },
];

export function coverToneFor(seed: string) {
  let sum = 0;
  for (let index = 0; index < seed.length; index++) {
    sum += seed.charCodeAt(index);
  }
  return COVER_TONES[sum % COVER_TONES.length]!;
}

// border-edge rather than border-hairline: a cover's background is never
// white, so the hairline wouldn't read against it.
export const coverBadgeClass = cn(
  keyShadowClass,
  "rounded-full border-2 border-edge bg-white px-3 py-1 text-[12px] font-semibold text-ink",
);

export const courseTagClass = cn(
  keyShadowClass,
  "rounded-full border-2 border-edge bg-white px-2.5 py-0.5 text-[11px] font-semibold text-ink-muted",
);

export const courseCardActionClass =
  "border-hairline text-ink-soft group-hover:border-[#b9d7ff] group-hover:text-link flex size-8 items-center justify-center rounded-[10px] border-2 bg-white shadow-[0_2px_0_0_var(--color-lip)] transition-colors";

interface CourseThumbnailProps {
  src: string | null;
  alt: string;

  seed: string;

  glyph?: ReactNode;

  children?: ReactNode;
}

export function CourseThumbnail({
  src,
  alt,
  seed,
  glyph = <BookOpen className="size-7" strokeWidth={2.2} />,
  children,
}: CourseThumbnailProps) {
  const tone = coverToneFor(seed);
  return (
    <div className="border-hairline relative h-48 w-full shrink-0 overflow-hidden border-b-2">
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
        />
      ) : (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center",
            tone.panel,
          )}
        >
          <span
            className={cn(
              "flex size-14 rotate-6 items-center justify-center rounded-[16px] border border-black/[0.06]",
              tone.tile,
            )}
          >
            {glyph}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}
