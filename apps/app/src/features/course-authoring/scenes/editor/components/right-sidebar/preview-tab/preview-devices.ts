export type PreviewMode = "desktop" | "mobile";

export const DEVICE_FRAME = 8;

export interface Device {
  id: string;
  width: number;
  height: number;
  label: string;
  rounded: number;
}

export const DEVICE_CATEGORIES = {
  mobile: [
    {
      id: "iphone-16-pro-max",
      width: 440,
      height: 956,
      label: "iPhone 16 Pro Max",
      rounded: 48,
    },
    {
      id: "iphone-16-pro",
      width: 402,
      height: 874,
      label: "iPhone 16 Pro",
      rounded: 48,
    },
    {
      id: "iphone-15",
      width: 393,
      height: 852,
      label: "iPhone 15",
      rounded: 44,
    },
    {
      id: "iphone-14",
      width: 390,
      height: 844,
      label: "iPhone 14",
      rounded: 44,
    },
    {
      id: "iphone-13-mini",
      width: 375,
      height: 812,
      label: "iPhone 13 mini",
      rounded: 40,
    },
  ],
  desktop: [
    {
      id: "desktop-1920",
      width: 1920,
      height: 1080,
      label: "Desktop (1920×1080)",
      rounded: 12,
    },
    {
      id: "desktop-1536",
      width: 1536,
      height: 864,
      label: "Laptop (1536×864)",
      rounded: 12,
    },
    {
      id: "desktop-1440",
      width: 1440,
      height: 900,
      label: "MacBook (1440×900)",
      rounded: 12,
    },
    {
      id: "desktop-1366",
      width: 1366,
      height: 768,
      label: "Laptop (1366×768)",
      rounded: 12,
    },
    {
      id: "desktop-1280",
      width: 1280,
      height: 800,
      label: "MacBook (1280×800)",
      rounded: 12,
    },
  ],
} satisfies Record<"mobile" | "desktop", Device[]>;
