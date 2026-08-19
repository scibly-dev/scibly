"use client";

import type { CourseShareTarget } from "./course-share-target";

import { Button } from "@scibly/ui/components/button";
import { Input } from "@scibly/ui/components/input";
import { Label } from "@scibly/ui/components/label";
import { Switch } from "@scibly/ui/components/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@scibly/ui/components/tabs";
import { useCopyFeedback } from "@scibly/ui/hooks/use-copy-feedback";
import { Check, Copy, Globe, Lock } from "lucide-react";
import { type ReactNode, useLayoutEffect, useRef, useState } from "react";

import { type CoursesTranslations } from "@/features/course-authoring/contracts";

import { EmbedSnippetPanel } from "./embed-snippet-panel";

// Left unanimated, the dialog would snap between the link and embed tab's very different
// heights on every switch, reading as a new dialog rather than the same one growing.
function AnimatedHeight({ children }: { children: ReactNode }) {
  const content = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();

  useLayoutEffect(() => {
    const node = content.current;
    if (!node) return;
    const observer = new ResizeObserver(() => setHeight(node.offsetHeight));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      style={{ height }}
      className="-mx-1 overflow-hidden px-1 transition-[height] duration-200 ease-out motion-reduce:transition-none"
    >
      <div ref={content}>{children}</div>
    </div>
  );
}

function PublicLinkPanel({
  publicUrl,
  t,
}: {
  publicUrl: string;
  t: CoursesTranslations;
}) {
  const copy = t.detail.share;
  const { copied, copy: copyToClipboard } = useCopyFeedback();
  return (
    <div className="grid gap-1.5">
      <Label
        htmlFor="public-course-link"
        className="text-ink-soft text-[11px] font-semibold"
      >
        {copy.linkLabel}
      </Label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Globe className="text-ink-faint absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
          <Input
            id="public-course-link"
            readOnly
            value={publicUrl}
            className="cursor-text bg-white pl-9 text-xs"
            onFocus={(event) => event.target.select()}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          aria-label={copy.copy}
          onClick={() => copyToClipboard(publicUrl)}
        >
          {copied ? (
            <Check className="animate-in zoom-in h-3.5 w-3.5 text-green-500 duration-200" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
      <p className="text-ink-soft text-[11px]">{copy.linkHint}</p>
    </div>
  );
}

function ShareOffPanel({ t }: { t: CoursesTranslations }) {
  const copy = t.detail.share;
  return (
    <div className="border-edge grid justify-items-center gap-1.5 rounded-xl border-2 border-dashed px-6 py-8 text-center">
      <Lock className="text-ink-faint mb-1 h-5 w-5" />
      <p className="text-ink text-sm font-semibold">{copy.offTitle}</p>
      <p className="text-ink-soft text-xs">{copy.offDescription}</p>
    </div>
  );
}

// Nothing here is form state — the switch saves itself, and the link and snippet are
// copied, never submitted.
export function CourseSharePanel({
  allowAnonymous,
  isPending,
  onAllowAnonymousChange,
  target,
  t,
}: {
  allowAnonymous: boolean;
  isPending: boolean;
  onAllowAnonymousChange: (allowAnonymous: boolean) => void;
  target: CourseShareTarget;
  t: CoursesTranslations;
}) {
  const copy = t.detail.share;
  return (
    <div className="grid gap-4">
      <div className="border-edge bg-ground flex items-start justify-between gap-4 rounded-xl border-2 p-3">
        <div className="grid gap-0.5">
          <p className="text-ink text-sm font-semibold">
            {copy.publicAccessLabel}
          </p>
          <p className="text-ink-soft text-xs">
            {copy.publicAccessDescription}
          </p>
        </div>
        <Switch
          id="allowAnonymous"
          checked={allowAnonymous}
          disabled={isPending}
          onCheckedChange={onAllowAnonymousChange}
          aria-label={copy.publicAccessLabel}
        />
      </div>

      <AnimatedHeight>
        {allowAnonymous ? (
          <Tabs defaultValue="link">
            <TabsList className="h-9">
              <TabsTrigger value="link" className="text-xs">
                {copy.tabLink}
              </TabsTrigger>
              <TabsTrigger value="embed" className="text-xs">
                {copy.tabEmbed}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="link" className="mt-3">
              <PublicLinkPanel publicUrl={target.publicUrl} t={t} />
            </TabsContent>
            <TabsContent value="embed" className="mt-3">
              <EmbedSnippetPanel target={target.embed} t={t} />
            </TabsContent>
          </Tabs>
        ) : (
          <ShareOffPanel t={t} />
        )}
      </AnimatedHeight>
    </div>
  );
}
