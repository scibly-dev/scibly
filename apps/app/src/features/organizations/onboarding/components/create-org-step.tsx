"use client";

import type { OnboardingPage } from "../i18n/onboarding.types";

import { autocaptureAttributes } from "@scibly/observability/autocapture";
import { routes } from "@scibly/routes";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@scibly/ui/components/avatar";
import { Button } from "@scibly/ui/components/button";
import { Popover, PopoverTrigger } from "@scibly/ui/components/popover";
import { cardClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import {
  Blocks,
  ImagePlus,
  Loader2,
  Lock,
  NotebookPen,
  Pencil,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { api } from "@/shared/api/trpc/client";
import FileUploadInput from "@/shared/content/editor/media/components/file-upload-input-popover";

import { SkipOnboardingButton } from "./skip-onboarding-button";

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 48);

// Built from the route itself, so the preview is the address the organization
// will actually answer on, host and all.
const URL_PREFIX = routes.app.profile.org("").root.replace(/^https?:\/\//, "");

// The pillar tints from the marketing pages — what the organization will hold.
const ICON_PROPS = { className: "size-4", strokeWidth: 2.2 };
const CONTENTS = [
  {
    key: "notebooks",
    icon: <NotebookPen {...ICON_PROPS} />,
    soft: "#e4f0ff",
    ink: "#0b4fb0",
  },
  {
    key: "courses",
    icon: <Blocks {...ICON_PROPS} />,
    soft: "#edfbdc",
    ink: "#376e00",
  },
  {
    key: "team",
    icon: <Users {...ICON_PROPS} />,
    soft: "#efeaff",
    ink: "#4b2bc4",
  },
] as const;

export function CreateOrgStep({ t }: { t: OnboardingPage }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const copy = t.createOrg;

  const createOrg = api.organization.create.useMutation({
    // The step the organization now unlocks is resolved server-side.
    onSuccess: () => router.refresh(),
    onError: (error) => toast.error(error.message || copy.errorToast),
  });

  const isSubmittable = Boolean(name.trim() && slug.trim());
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <form
      className="flex w-full max-w-xl flex-col items-stretch gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!isSubmittable || createOrg.isPending) return;
        createOrg.mutate({
          name: name.trim(),
          slug: slug.trim(),
          logo: logo ?? undefined,
        });
      }}
    >
      {/* The organization as a window onto itself: its address, its identity,
          and what it will hold — all filled in as you type. */}
      <div className={cn(cardClass, "overflow-hidden")}>
        <div className="border-hairline bg-ground text-ink-faint flex items-center gap-2 border-b-2 px-4 py-2.5 font-mono text-[12.5px]">
          <Lock className="size-3.5 shrink-0" />
          <span className="truncate">{URL_PREFIX}</span>
          <label htmlFor="org-slug" className="sr-only">
            {copy.slugLabel}
          </label>
          {/* Dashed while idle, solid while focused: the address is the one part
              of the URL that is yours to change. */}
          <input
            id="org-slug"
            value={slug}
            autoComplete="off"
            placeholder={copy.slugPlaceholder}
            onChange={(event) => {
              setSlugEdited(true);
              setSlug(slugify(event.target.value));
            }}
            className="text-ink placeholder:text-ink-faint hover:border-ink-faint min-w-0 flex-1 border-0 border-b-2 border-dashed border-[#c3d0e6] bg-transparent p-0 outline-none focus:border-solid focus:border-[#0066FF] focus-visible:outline-none"
          />
          <Pencil className="size-3 shrink-0" />
        </div>

        <div className="flex items-center gap-4 px-5 py-6 sm:px-7">
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={copy.logoLabel}
                className="group relative size-16 shrink-0 rounded-2xl focus-visible:ring-4 focus-visible:ring-[#0066FF]/25 focus-visible:outline-none"
              >
                <span
                  className={cn(
                    "grid size-full place-items-center overflow-hidden rounded-2xl text-[28px] font-bold transition-colors duration-300",
                    logo || initial
                      ? "bg-[#0066FF] text-white shadow-[0_3px_0_0_#0046ad,inset_0_1px_0_rgba(255,255,255,0.28)]"
                      : "border-hairline text-ink-faint group-hover:border-edge border-2 border-dashed",
                  )}
                >
                  {logoUploading ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : logo ? (
                    <Avatar className="size-full rounded-none">
                      <AvatarImage src={logo} className="object-cover" alt="" />
                      <AvatarFallback className="rounded-none bg-transparent text-white">
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    initial || <ImagePlus className="size-6" />
                  )}
                  <span className="bg-ink/45 absolute inset-0 grid place-items-center rounded-2xl text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    <ImagePlus className="size-5" />
                  </span>
                </span>
                {/* Always-on badge — the tile reads as a picture, not a button,
                    until something says otherwise. */}
                <span className="border-hairline text-ink-muted group-hover:text-ink absolute -right-1.5 -bottom-1.5 grid size-7 place-items-center rounded-full border-2 bg-white shadow-[0_2px_0_0_var(--color-lip)]">
                  <ImagePlus className="size-3.5" />
                </span>
              </button>
            </PopoverTrigger>
            <FileUploadInput
              mediaType="image"
              useEditorBucket={false}
              hideUploadTab={false}
              setLoading={setLogoUploading}
              setNewUrl={(url) => {
                setLogo(url);
                setLogoUploading(false);
              }}
              onUploadSuccess={() => setPickerOpen(false)}
            />
          </Popover>

          <label htmlFor="org-name" className="sr-only">
            {copy.nameLabel}
          </label>
          <input
            id="org-name"
            value={name}
            autoFocus
            autoComplete="off"
            placeholder={copy.namePlaceholder}
            onChange={(event) => {
              setName(event.target.value);
              if (!slugEdited) setSlug(slugify(event.target.value));
            }}
            className="placeholder:text-ink-faint min-w-0 flex-1 border-0 border-b-2 border-transparent bg-transparent p-0 pb-1 text-[26px] leading-tight font-medium tracking-[-0.02em] outline-none focus:border-[#0066FF] focus-visible:outline-none"
          />
        </div>

        <div className="border-hairline flex flex-wrap gap-2 border-t-2 border-dashed px-5 py-4 sm:px-7">
          {CONTENTS.map(({ key, icon, soft, ink }) => (
            <span
              key={key}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-[13px] font-semibold"
              style={{ backgroundColor: soft, color: ink }}
            >
              {icon}
              {copy.contents[key]}
            </span>
          ))}
        </div>
      </div>

      <Button
        type="submit"
        variant="brand"
        size="lg"
        disabled={!isSubmittable || createOrg.isPending}
        {...autocaptureAttributes({ action: "onboarding_create_org_submit" })}
      >
        <span className="pointer-events-none flex items-center gap-2">
          {createOrg.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {copy.submitting}
            </>
          ) : (
            copy.submit
          )}
        </span>
      </Button>

      <SkipOnboardingButton
        label={copy.skip}
        destination={routes.app.profile.default}
      />
    </form>
  );
}
