import { Button } from "@scibly/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@scibly/ui/components/dropdown-menu";
import { cn } from "@scibly/ui/utils";
import {
  Check,
  ChevronDown,
  Maximize2,
  Minimize2,
  Monitor,
  Smartphone,
} from "lucide-react";
import { createElement } from "react";

import {
  type Device,
  DEVICE_CATEGORIES,
  type PreviewMode,
} from "./preview-devices";

const ModeButtons = ({
  mode,
  onChange,
}: {
  mode: PreviewMode;
  onChange: (mode: PreviewMode) => void;
}) => {
  const modes = [
    { value: "desktop" as const, icon: Monitor },
    { value: "mobile" as const, icon: Smartphone },
  ];
  return (
    <div className="bg-ground flex shrink-0 items-center rounded-xl p-1 dark:bg-neutral-900">
      {modes.map(({ value, icon }) => (
        <Button
          key={value}
          variant="ghost"
          size="icon"
          onClick={() => onChange(value)}
          aria-label={`${value} preview`}
          aria-pressed={mode === value}
          className={cn(
            "h-8 w-10 rounded-[10px] transition-all",
            mode === value
              ? "text-link bg-white shadow-[0_2px_0_0_var(--color-edge)] dark:bg-neutral-800 dark:text-blue-400 dark:shadow-none"
              : "text-ink-faint hover:text-ink dark:hover:text-neutral-100",
          )}
        >
          {createElement(icon, { className: "h-4 w-4" })}
        </Button>
      ))}
    </div>
  );
};

const DeviceMenu = ({
  mode,
  currentDevice,
  container,
  onSelectMobile,
  onSelectDesktop,
}: {
  mode: PreviewMode;
  currentDevice: Device;
  container: HTMLElement | null;
  onSelectMobile: (device: Device) => void;
  onSelectDesktop: (device: Device) => void;
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="text-ink-muted hover:text-ink h-8 rounded-[10px] text-[12px] font-semibold dark:hover:text-neutral-100"
        >
          {currentDevice.label}
          <ChevronDown className="ml-1.5 h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        container={container}
        className="w-[200px]"
      >
        {DEVICE_CATEGORIES[mode].map((device) => (
          <DropdownMenuItem
            key={device.id}
            onClick={() =>
              mode === "mobile"
                ? onSelectMobile(device)
                : onSelectDesktop(device)
            }
            className="flex items-center justify-between text-[13px]"
          >
            <span>{device.label}</span>
            {currentDevice.id === device.id ? (
              <Check className="h-3.5 w-3.5" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export function PreviewControls({
  mode,
  currentDevice,
  fullscreenEl,
  onModeChange,
  onSelectMobile,
  onSelectDesktop,
  onToggleFullscreen,
}: {
  mode: PreviewMode;
  currentDevice: Device;

  fullscreenEl: HTMLElement | null;
  onModeChange: (mode: PreviewMode) => void;
  onSelectMobile: (device: Device) => void;
  onSelectDesktop: (device: Device) => void;
  onToggleFullscreen: () => void;
}) {
  const isFullscreen = fullscreenEl !== null;
  return (
    <div className="mt-auto flex items-center justify-between pt-6 pb-2">
      <ModeButtons mode={mode} onChange={onModeChange} />
      <DeviceMenu
        mode={mode}
        currentDevice={currentDevice}
        container={fullscreenEl}
        onSelectMobile={onSelectMobile}
        onSelectDesktop={onSelectDesktop}
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleFullscreen}
        aria-label={isFullscreen ? "Exit full screen" : "Full screen preview"}
        className="text-ink-faint hover:bg-ground hover:text-ink h-10 w-10 shrink-0 rounded-[10px] dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
      >
        {isFullscreen ? (
          <Minimize2 className="h-4 w-4" />
        ) : (
          <Maximize2 className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
