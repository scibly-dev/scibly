import { zodResolver } from "@hookform/resolvers/zod";
import { CourseMode } from "@scibly/db/enums";
import { routes } from "@scibly/routes";
import { Button } from "@scibly/ui/components/button";
import { Input } from "@scibly/ui/components/input";
import { Label } from "@scibly/ui/components/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@scibly/ui/components/sheet";
import { Textarea } from "@scibly/ui/components/textarea";
import {
  type Control,
  Controller,
  type FieldErrors,
  useForm,
  type UseFormRegister,
} from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { type CoursesTranslations } from "@/features/course-authoring/contracts";
import { useTranslation } from "@/i18n/hooks/use-translation";
import { api } from "@/shared/api/trpc/client";
import { useNavigationTransition } from "@/shared/ui/hooks/use-navigation-transition";

import { CourseModeField } from "../../admin/components/course-mode-field";

const createFormSchema = (titleRequired: string) =>
  z.object({
    title: z.string().min(1, titleRequired),
    description: z.string().optional(),
    category: z.string().optional(),
    mode: z.enum(CourseMode),
  });

type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

export function CourseCreateFields({
  control,
  errors,
  register,
  t,
}: {
  control: Control<FormValues>;
  errors: FieldErrors<FormValues>;
  register: UseFormRegister<FormValues>;
  t: CoursesTranslations;
}) {
  return (
    <div className="space-y-5">
      <Controller
        control={control}
        name="mode"
        render={({ field }) => (
          <CourseModeField
            value={field.value}
            onChange={field.onChange}
            t={t}
          />
        )}
      />
      <div className="space-y-2">
        <Label htmlFor="title">{t.createSheet.fieldTitle}</Label>
        <Input
          id="title"
          placeholder={t.createSheet.fieldTitlePlaceholder}
          {...register("title")}
        />
        {errors.title && (
          <span className="text-sm text-red-500">{errors.title.message}</span>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">{t.createSheet.fieldDescription}</Label>
        <Textarea
          id="description"
          placeholder={t.createSheet.fieldDescriptionPlaceholder}
          className="resize-none"
          {...register("description")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">{t.createSheet.fieldCategory}</Label>
        <Input
          id="category"
          placeholder={t.createSheet.fieldCategoryPlaceholder}
          {...register("category")}
        />
      </div>
    </div>
  );
}

export function CourseCreateFooter({
  onCancel,
  pending,
  t,
}: {
  onCancel: () => void;
  pending: boolean;
  t: CoursesTranslations;
}) {
  return (
    <SheetFooter className="border-hairline border-t-2 bg-white px-6 py-4">
      <SheetClose asChild>
        <Button variant="outline" onClick={onCancel}>
          {t.createSheet.cancel}
        </Button>
      </SheetClose>
      <Button type="submit" form="course-create-form" disabled={pending}>
        {pending ? t.createSheet.creating : t.createSheet.createButton}
      </Button>
    </SheetFooter>
  );
}

export function CourseCreateSheet({
  orgSlug,
  open,
  onOpenChange,
}: {
  orgSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { translations: t } = useTranslation("courses");
  const { isNavigating, navigate } = useNavigationTransition();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(createFormSchema(t.createSheet.titleRequired)),
    defaultValues: { mode: "COURSE" },
  });

  const createMutation = api.course.create.useMutation({
    onSuccess: (course) => {
      toast.success(t.createSheet.toastSuccess);
      navigate(routes.app.profile.org(orgSlug).courses.detail(course.id));
    },
    onError: (error) => {
      toast.error(error.message || t.createSheet.toastError);
    },
  });

  const onSubmit = (data: FormValues) => {
    createMutation.mutate({
      orgSlug,
      title: data.title,
      description: data.description || undefined,
      category: data.category || undefined,
      mode: data.mode,
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      reset();
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="border-hairline flex h-full flex-col border-l-2 bg-white p-0 sm:max-w-[500px]">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle className="text-ink text-xl font-semibold tracking-tight">
            {t.createSheet.title}
          </SheetTitle>
          <SheetDescription className="text-ink-muted mt-1 text-[13px] leading-relaxed">
            {t.createSheet.description}
          </SheetDescription>
        </SheetHeader>

        <form
          id="course-create-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 space-y-6 overflow-y-auto px-6 py-4"
        >
          <CourseCreateFields
            control={control}
            errors={errors}
            register={register}
            t={t}
          />
        </form>

        <CourseCreateFooter
          onCancel={() => handleOpenChange(false)}
          pending={createMutation.isPending || isNavigating}
          t={t}
        />
      </SheetContent>
    </Sheet>
  );
}
