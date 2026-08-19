"use client";

import type { StripePlanKey } from "@scibly/db/plan-catalogue";

import { Button } from "@scibly/ui/components/button";
import { cardClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import { Check, Crown, Loader2, Minus, Rocket, Sprout } from "lucide-react";

export type PlanCardCopy = {
  name: string;
  price: string;
  period: string;
  tagline: string;
  credits: string;
  seats: string;
  sources: string;
  cta: string;
};

// Each plan gets its own tint so the three read as a range rather than three
// copies of the same card. Taken from the marketing pillar palette.
const PLAN_TONES = {
  starter: {
    icon: <Sprout className="size-4" strokeWidth={2.2} />,
    band: "#eaf3ff",
    ink: "#0b4fb0",
    lip: "#c9dfff",
  },
  business: {
    icon: <Rocket className="size-4" strokeWidth={2.2} />,
    band: "#dcebff",
    ink: "#0046ad",
    lip: "#9cc6ff",
  },
  pro: {
    icon: <Crown className="size-4" strokeWidth={2.2} />,
    band: "#f0ecff",
    ink: "#4b2bc4",
    lip: "#d3c8ff",
  },
};

function Feature({
  label,
  included,
  ink,
  band,
}: {
  label: string;
  included: boolean;
  ink: string;
  band: string;
}) {
  return (
    <li className="flex items-start gap-2.5 text-[13.5px]">
      <span
        className={cn(
          "mt-px grid size-5 shrink-0 place-items-center rounded-[7px]",
          included ? undefined : "border-hairline border-2 border-dashed",
        )}
        style={
          included
            ? { backgroundColor: band, color: ink }
            : { color: "#94a3b8" }
        }
      >
        {included ? (
          <Check className="size-3" strokeWidth={3} />
        ) : (
          <Minus className="size-3" strokeWidth={3} />
        )}
      </span>
      <span className={cn("text-ink", included ? undefined : "opacity-45")}>
        {label}
      </span>
    </li>
  );
}

export function PlanCard({
  planKey,
  copy,
  highlighted,
  badge,
  pending,
  disabled,
  vatNote,
  byoaiLabel,
  byoaiIncluded,
  onSubscribe,
}: {
  planKey: StripePlanKey;
  copy: PlanCardCopy;
  highlighted?: boolean;
  badge?: string;
  pending: boolean;
  disabled: boolean;
  vatNote: string;
  byoaiLabel: string;
  byoaiIncluded: boolean;
  onSubscribe: () => void;
}) {
  const tone = PLAN_TONES[planKey];

  return (
    <div
      className={cn(
        cardClass,
        "flex flex-col overflow-hidden transition-[translate,box-shadow] duration-150",
        // The popular plan is lifted rather than filled in — the eye finds it
        // without the card shouting over the two beside it.
        highlighted && "border-[#0066FF] md:-translate-y-4",
      )}
      style={{
        boxShadow: `0 4px 0 0 ${highlighted ? "#0066FF" : tone.lip}`,
      }}
    >
      <div
        className="flex items-center gap-2.5 px-5 py-4"
        style={{ backgroundColor: tone.band, color: tone.ink }}
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-white/70">
          {tone.icon}
        </span>
        <h4 className="text-[15px] font-bold">{copy.name}</h4>
        {badge ? (
          <span className="ml-auto rounded-full bg-white px-2.5 py-1 text-[10.5px] font-bold tracking-[0.06em] uppercase">
            {badge}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-5 px-5 py-5">
        <p className="text-ink-muted text-[13px]">{copy.tagline}</p>

        <div className="flex items-baseline gap-1.5">
          <span className="text-ink text-[38px] leading-none font-bold tracking-[-0.03em]">
            {copy.price}
          </span>
          <span className="text-ink-muted text-[13px]">{copy.period}</span>
          <span className="text-ink-faint ml-auto text-[11px]">{vatNote}</span>
        </div>

        <ul className="flex flex-col gap-2.5">
          {[copy.credits, copy.seats, copy.sources].map((label) => (
            <Feature
              key={label}
              label={label}
              included
              ink={tone.ink}
              band={tone.band}
            />
          ))}
          <Feature
            label={byoaiLabel}
            included={byoaiIncluded}
            ink={tone.ink}
            band={tone.band}
          />
        </ul>

        <Button
          onClick={onSubscribe}
          disabled={disabled}
          variant={highlighted ? "brand" : "outline"}
          size="lg"
          className="mt-auto w-full"
        >
          <span className="pointer-events-none flex items-center gap-2">
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            {copy.cta}
          </span>
        </Button>
      </div>
    </div>
  );
}
