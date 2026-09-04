import { useMemo } from "react";
import { useDebouncedCallback } from "use-debounce";

import { api } from "@/shared/api/trpc/client";
import {
  type LessonDesign,
  lessonDesignSchema,
  MODERN_MINIMAL_DESIGN,
} from "@/shared/content/course/course-validation";
import { useSaveState } from "@/shared/ui/hooks/use-save-state";
import { useSyncedState } from "@/shared/ui/hooks/use-synced-state";

import { type Lesson } from "../../../../lessons/builder/components/lesson-builder";
import { DesignTabFields } from "./design-tab-fields";

export { DESIGN_PRESETS as PRESETS } from "./design-presets";

interface DesignTabProps {
  courseId: string;
  lesson: Lesson;
}

export function lessonDesign(lesson: Lesson): LessonDesign {
  const stored = lessonDesignSchema.safeParse(lesson.design);
  return stored.success ? stored.data : MODERN_MINIMAL_DESIGN;
}

function useDesignState({ courseId, lesson }: DesignTabProps) {
  const addSave = useSaveState((state) => state.addSave);
  const removeSave = useSaveState((state) => state.removeSave);
  const utils = api.useUtils();
  const design = useMemo(() => lessonDesign(lesson), [lesson]);

  const { mutate } = api.course.updateLesson.useMutation({
    onMutate: ({ design: next }) => {
      addSave();
      utils.course.getLesson.setData(
        { courseId, lessonId: lesson.id },
        (old) => (old ? { ...old, design: next ?? null } : old),
      );
    },
    onError: (error) => {
      console.error(error);
      utils.course.getLesson.invalidate({ courseId, lessonId: lesson.id });
    },
    onSettled: () => removeSave(),
  });

  const save = (next: LessonDesign) =>
    mutate({ courseId, lessonId: lesson.id, design: next });

  const [colors, setColors] = useSyncedState(design, design);

  const debouncedSaveColor = useDebouncedCallback(
    (field: keyof LessonDesign, value: string) =>
      save({ ...colors, [field]: value }),
    500,
  );

  return { colors, setColors, save, debouncedSaveColor };
}

export function DesignTab(props: DesignTabProps) {
  const { colors, setColors, save, debouncedSaveColor } = useDesignState(props);

  return (
    <DesignTabFields
      design={colors}
      onPreset={save}
      onColor={(field, value) => {
        setColors((current) => ({ ...current, [field]: value }));
        debouncedSaveColor(field, value);
      }}
    />
  );
}
