import type React from "react";

import { z } from "zod";

interface SceneDesignInput {
  design?: unknown;
  type?: string | null;
}

const sceneDesign = z.object({
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  primaryColor: z.string().optional(),
  fontFamily: z.string().optional(),
});

function asDesignRecord(design: unknown) {
  return sceneDesign.safeParse(design).data ?? null;
}

export const DEFAULT_INK = "#131c46";
export const DEFAULT_PRIMARY = "#0066ff";

const DEFAULT_PRIMARY_LIP = "#0046ad";

export type StyleWithCssVars = React.CSSProperties &
  Record<`--${string}`, string>;

export function getSceneDesignVars(scene: SceneDesignInput): StyleWithCssVars {
  const design = asDesignRecord(scene.design);
  return {
    backgroundColor: design?.backgroundColor || "#ffffff",
    "--editor-text-color": design?.textColor || DEFAULT_INK,
    "--editor-heading-color": design?.textColor || DEFAULT_INK,
    "--editor-primary-color": design?.primaryColor || DEFAULT_PRIMARY,
    "--editor-font-family": design?.fontFamily || "var(--font-sans)",
  };
}

export function getScenePrimaryButtonStyle(
  scene: SceneDesignInput,
): React.CSSProperties {
  const design = asDesignRecord(scene.design);
  const primary = design?.primaryColor || DEFAULT_PRIMARY;
  return {
    backgroundColor: primary,
    color: ["#ffffff", "#fff", "#f9fafb"].includes(primary.toLowerCase())
      ? "#000"
      : "#fff",
  };
}

export function getScenePrimaryButtonShadowColor(
  scene: SceneDesignInput,
): string {
  const primary = asDesignRecord(scene.design)?.primaryColor;
  return primary
    ? `color-mix(in srgb, ${primary} 75%, black)`
    : DEFAULT_PRIMARY_LIP;
}
