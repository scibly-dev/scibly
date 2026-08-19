import type { Control } from "react-hook-form";
import type { DictionaryPages } from "@/i18n/types";
import type { CourseEditFormValues } from "./course-edit-form";

import { Input } from "@scibly/ui/components/input";
import { Label } from "@scibly/ui/components/label";
import { Controller } from "react-hook-form";

export function CourseCompletionPolicyFields({
  control,
  t,
}: {
  control: Control<CourseEditFormValues>;
  t: DictionaryPages["courses"];
}) {
  return (
    <div className="border-hairline grid gap-4 border-t-2 pt-5">
      <p className="text-ink-soft text-xs font-semibold tracking-wider uppercase">
        {t.detail.editSheet.policyTitle}
      </p>
      <div className="grid gap-2">
        <Label htmlFor="passingScorePct">
          {t.detail.editSheet.minScoreLabel}
        </Label>
        <div className="relative">
          <Controller
            control={control}
            name="passingScorePct"
            render={({ field }) => (
              <Input
                id="passingScorePct"
                type="number"
                min={0}
                max={100}
                placeholder={t.detail.editSheet.noMinimum}
                className="pr-8"
                value={field.value ?? ""}
                onChange={(event) =>
                  field.onChange(
                    event.target.value === ""
                      ? null
                      : parseInt(event.target.value, 10),
                  )
                }
              />
            )}
          />
          <span className="text-ink-faint pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm">
            %
          </span>
        </div>
        <p className="text-ink-soft text-xs">
          {t.detail.editSheet.minScoreDescription}
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="maxTries">{t.detail.editSheet.maxAttemptsLabel}</Label>
        <Controller
          control={control}
          name="maxTries"
          render={({ field }) => (
            <Input
              id="maxTries"
              type="number"
              min={1}
              placeholder={t.detail.editSheet.unlimitedAttempts}
              value={field.value ?? ""}
              onChange={(event) =>
                field.onChange(
                  event.target.value === ""
                    ? null
                    : parseInt(event.target.value, 10),
                )
              }
            />
          )}
        />
        <p className="text-ink-soft text-xs">
          {t.detail.editSheet.maxAttemptsDescription}
        </p>
      </div>
    </div>
  );
}
