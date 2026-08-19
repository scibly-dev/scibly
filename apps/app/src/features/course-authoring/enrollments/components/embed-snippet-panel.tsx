"use client";

import type { EmbedTarget } from "./course-share-target";

import { LanguageOptions } from "@scibly/i18n/constants";
import { Button } from "@scibly/ui/components/button";
import { Label } from "@scibly/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@scibly/ui/components/select";
import { Switch } from "@scibly/ui/components/switch";
import { useCopyFeedback } from "@scibly/ui/hooks/use-copy-feedback";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { type CoursesTranslations } from "@/features/course-authoring/contracts";
import {
  buildEmbedSnippet,
  DEFAULT_EMBED_HEIGHT,
  EMBED_HEIGHT_OPTIONS,
  EMBED_LANGUAGE_AUTO,
} from "@/features/learning/contracts";

const FIELD_LABEL = "text-ink-soft text-[11px] font-semibold";

export function EmbedSnippetPanel({
  target,
  t,
}: {
  target: EmbedTarget;
  t: CoursesTranslations;
}) {
  const copy = t.detail.share;
  const [language, setLanguage] = useState<string>(EMBED_LANGUAGE_AUTO);
  const [height, setHeight] = useState(String(DEFAULT_EMBED_HEIGHT));
  const [includeScript, setIncludeScript] = useState(true);
  const { copied, copy: copyToClipboard } = useCopyFeedback();

  const snippet = buildEmbedSnippet({
    appOrigin: target.appOrigin,
    courseId: target.courseId,
    courseTitle: target.courseTitle,
    lang: language,
    heightPx: Number(height),
    includeScript,
  });

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="embed-language" className={FIELD_LABEL}>
            {copy.embedLanguage}
          </Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger id="embed-language" className="h-9 bg-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={EMBED_LANGUAGE_AUTO}>
                {copy.embedLanguageAuto}
              </SelectItem>
              {LanguageOptions[target.lang].map((option) => (
                <SelectItem key={option.code} value={option.code}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="embed-height" className={FIELD_LABEL}>
            {copy.embedHeight}
          </Label>
          <Select value={height} onValueChange={setHeight}>
            <SelectTrigger id="embed-height" className="h-9 bg-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EMBED_HEIGHT_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option} px
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-ink-soft -mt-1 text-[11px]">
        {copy.embedHeightDescription.replace(
          "{{px}}",
          String(DEFAULT_EMBED_HEIGHT),
        )}
      </p>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-ink text-xs font-semibold">
            {copy.embedResizeLabel}
          </p>
          <p className="text-ink-soft mt-0.5 text-[11px]">
            {copy.embedResizeDescription}
          </p>
        </div>
        <Switch
          id="embed-include-script"
          checked={includeScript}
          onCheckedChange={setIncludeScript}
          aria-label={copy.embedResizeLabel}
        />
      </div>

      <div className="grid gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="embed-snippet" className={FIELD_LABEL}>
            {copy.embedCodeLabel}
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 bg-white text-xs"
            onClick={() => copyToClipboard(snippet)}
          >
            {copied ? (
              <Check className="animate-in zoom-in h-3 w-3 text-green-500 duration-200" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            {copied ? copy.copied : copy.copy}
          </Button>
        </div>
        <textarea
          id="embed-snippet"
          readOnly
          rows={includeScript ? 10 : 9}
          value={snippet}
          spellCheck={false}
          onFocus={(event) => event.target.select()}
          className="border-edge text-ink-soft w-full resize-none rounded-xl border-2 bg-white p-2.5 font-mono text-[11px] leading-relaxed"
        />
        <p className="text-ink-soft text-[11px]">{copy.embedHint}</p>
      </div>
    </div>
  );
}
