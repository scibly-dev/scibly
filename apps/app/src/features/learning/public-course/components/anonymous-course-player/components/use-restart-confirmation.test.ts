import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useRestartConfirmation } from "./use-restart-confirmation";

describe("restart confirmation gate", () => {
  it("RC1: requestRestart opens the confirmation without calling onConfirmedRestart", () => {
    const onConfirmedRestart = vi.fn();
    const { result } = renderHook(() =>
      useRestartConfirmation(onConfirmedRestart),
    );

    act(() => result.current.requestRestart());

    expect(result.current.isOpen).toBe(true);
    expect(onConfirmedRestart).not.toHaveBeenCalled();
  });

  it("RC2: confirm calls onConfirmedRestart exactly once and closes the confirmation", () => {
    const onConfirmedRestart = vi.fn();
    const { result } = renderHook(() =>
      useRestartConfirmation(onConfirmedRestart),
    );

    act(() => result.current.requestRestart());
    act(() => result.current.confirm());

    expect(onConfirmedRestart).toHaveBeenCalledTimes(1);
    expect(result.current.isOpen).toBe(false);
  });

  it("RC3: cancel closes the confirmation without ever calling onConfirmedRestart", () => {
    const onConfirmedRestart = vi.fn();
    const { result } = renderHook(() =>
      useRestartConfirmation(onConfirmedRestart),
    );

    act(() => result.current.requestRestart());
    act(() => result.current.cancel());

    expect(result.current.isOpen).toBe(false);
    expect(onConfirmedRestart).not.toHaveBeenCalled();
  });
});
