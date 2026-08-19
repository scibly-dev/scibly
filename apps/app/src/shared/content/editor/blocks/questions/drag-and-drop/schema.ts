import { z } from "zod";

export const DRAG_AND_DROP_NODE_NAME = "custom-drag-and-drop";

export type DraggableItem = {
  id: string;
  label: string;
};

export type DropZone = {
  id: string;
  label: string;
};

export type QuestionData = {
  items: DraggableItem[];
  zones: DropZone[];

  correctMappings: Record<string, string>;
};

export type UserAnswer = Record<string, string>;

export const defaultQuestionData: QuestionData = {
  items: [{ id: "item-1", label: "Apfel" }],
  zones: [{ id: "zone-1", label: "Früchte" }],
  correctMappings: {
    "item-1": "zone-1",
  },
};

export const defaultAnswerData: UserAnswer = {};

export const userAnswerStructureSchema = z.record(z.string(), z.string());

export const questionDataStructureSchema = z.strictObject({
  items: z.array(z.strictObject({ id: z.string(), label: z.string() })),
  zones: z.array(z.strictObject({ id: z.string(), label: z.string() })),
  correctMappings: z.record(z.string(), z.string()),
});

const itemSchema = z.object({
  id: z.string(),
  label: z.string().trim().min(1, "Label cannot be empty"),
});

const zoneSchema = z.object({
  id: z.string(),
  label: z.string().trim().min(1, "Label cannot be empty"),
});

export const dragAndDropSchema = z.object({
  items: z.array(itemSchema).min(1, "At least 1 item is required"),
  zones: z.array(zoneSchema).min(1, "At least 1 zone is required"),
  correctMappings: z.record(z.string(), z.string()),
});
