import { routes } from "@scibly/routes";
import { cn } from "@scibly/ui/utils";
import Link from "next/link";

export const COMPANY_NAME = "scibly";
const COMPANY_NAME_MINIMAL = COMPANY_NAME.slice(0, 1);

const sizeOptions = {
  small: "text-[20px] font-semibold tracking-[-0.03em]",
  medium: "text-3xl font-semibold tracking-[-0.03em]",
  large: "text-4xl font-semibold tracking-[-0.03em]",
};

type Sizes = keyof typeof sizeOptions;

// Only renders correctly on a dark tile — the tile fill is `currentColor` but the glyph is hardcoded white.
export const SciblyMark = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 96 96"
    fill="none"
    aria-hidden
    className={cn("text-ink", className)}
  >
    <rect width="96" height="96" rx="16" fill="currentColor" />
    <g transform="translate(24 24) scale(.8)">
      <path
        d="M60 0H30C13.431 0 0 13.431 0 30v10h20V30c0-5.523 4.477-10 10-10h30V0Z"
        fill="white"
      />
      <path
        d="M0 60h30c16.569 0 30-13.431 30-30V20H40v10c0 5.523-4.477 10-10 10H0v20Z"
        fill="white"
      />
    </g>
  </svg>
);

const Logo = ({
  className,
  minimal,
  size = "medium",
  href = routes.web.base.home,
}: {
  className?: string;
  minimal?: boolean;
  size?: Sizes;
  href?: string;
}) => {
  return (
    <span className={cn(sizeOptions[size], className)}>
      <Link href={href} className="transition-opacity hover:opacity-80">
        {minimal ? COMPANY_NAME_MINIMAL : COMPANY_NAME}
      </Link>
    </span>
  );
};

export default Logo;
