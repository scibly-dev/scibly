import type { Editor } from "@tiptap/core";

import { GripHorizontal, ListChecks, ListOrdered, Play } from "lucide-react";

export interface Template {
  id: string;
  label: string;
  icon: React.ReactNode;
  insert: (editor: Editor) => void;
}

export const TEMPLATES: Template[] = [
  {
    id: "video-intro",
    label: "Video Intro",
    icon: <Play className="h-4 w-4 text-blue-500 drop-shadow-sm" />,
    insert: (editor) => {
      editor
        .chain()
        .focus()
        .clearContent()
        .insertContent([
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "Introduction" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Watch the video below to get started with this lesson.",
              },
            ],
          },
        ])
        .insertVideoPlayer()
        .run();
    },
  },
  {
    id: "knowledge-check",
    label: "Knowledge Check",
    icon: <ListChecks className="h-4 w-4 text-amber-500 drop-shadow-sm" />,
    insert: (editor) => {
      editor
        .chain()
        .focus()
        .clearContent()
        .insertContent([
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Knowledge Check" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Test your understanding with the question below.",
              },
            ],
          },
        ])
        .insertMultipleChoice()
        .run();
    },
  },
  {
    id: "matching-exercise",
    label: "Matching Exercise",
    icon: <GripHorizontal className="h-4 w-4 text-purple-500 drop-shadow-sm" />,
    insert: (editor) => {
      editor
        .chain()
        .focus()
        .clearContent()
        .insertContent([
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Match the Pairs" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Drag each item on the left to its correct match on the right.",
              },
            ],
          },
        ])
        .insertDragAndDrop()
        .run();
    },
  },
  {
    id: "step-by-step",
    label: "Step-by-Step",
    icon: <ListOrdered className="h-4 w-4 text-emerald-500 drop-shadow-sm" />,
    insert: (editor) => {
      editor
        .chain()
        .focus()
        .clearContent()
        .insertContent([
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Step-by-Step Guide" }],
          },
          {
            type: "orderedList",
            content: [
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "First, …" }],
                  },
                ],
              },
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Then, …" }],
                  },
                ],
              },
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Finally, …" }],
                  },
                ],
              },
            ],
          },
          {
            type: "paragraph",
          },
        ])
        .insertInlineHint()
        .run();
    },
  },
];
