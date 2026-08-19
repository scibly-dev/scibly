"use client";

import type { CSSProperties } from "react";

import {
  LESSON_ICON_MAP,
  normalizeLessonIcon,
} from "@/shared/content/course/lesson-icons";

interface LessonIconGlyphProps {
  icon: Parameters<typeof normalizeLessonIcon>[0];
  className?: string;
  strokeWidth?: number;
  style?: CSSProperties;
}

export function LessonIconGlyph({
  icon,
  className,
  strokeWidth = 2.25,
  style,
}: LessonIconGlyphProps) {
  const LessonIconComponent = LESSON_ICON_MAP[normalizeLessonIcon(icon)];
  return (
    <LessonIconComponent
      className={className}
      strokeWidth={strokeWidth}
      style={style}
    />
  );
}
