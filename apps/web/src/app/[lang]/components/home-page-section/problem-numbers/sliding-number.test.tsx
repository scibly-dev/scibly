import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SlidingNumber } from "./sliding-number";

function columns(container: HTMLElement) {
  return container.querySelectorAll("span.inline-block.overflow-hidden");
}

describe("SlidingNumber", () => {
  it("gives a two-digit number two columns and keeps the suffix as literal text", () => {
    const { container } = render(<SlidingNumber value="48%" active />);

    expect(columns(container)).toHaveLength(2);
    expect(container.querySelector("span.whitespace-pre")?.textContent).toBe(
      "%",
    );
  });

  it("gives a single digit one column", () => {
    const { container } = render(<SlidingNumber value="0" active />);

    expect(columns(container)).toHaveLength(1);
  });

  it("keeps every digit of a grouped thousand", () => {
    // German groups thousands with a dot, so "1.000" is four digits, not "1.0".
    const { container } = render(<SlidingNumber value="1.000" active />);

    expect(columns(container)).toHaveLength(4);
    expect(container.querySelector("span.whitespace-pre")?.textContent).toBe(
      ".",
    );
  });

  it("keeps leading zeroes", () => {
    const { container } = render(<SlidingNumber value="007" active />);

    expect(columns(container)).toHaveLength(3);
  });

  it("always exposes the untouched value to screen readers", () => {
    const { container } = render(<SlidingNumber value="1.000" active />);

    expect(container.querySelector(".sr-only")?.textContent).toBe("1.000");
  });

  it("offers the plain value as the no-script stand-in for the wheels", () => {
    const { container } = render(<SlidingNumber value="48%" active={false} />);

    expect(container.querySelector(".sc-roll-plain")?.textContent).toBe("48%");
  });

  it("reveals the wheels only once activated", () => {
    const { container: idle } = render(
      <SlidingNumber value="48%" active={false} />,
    );
    expect(idle.querySelector(".sc-roll")?.className).not.toContain(
      "sc-roll-ready",
    );

    const { container: running } = render(<SlidingNumber value="48%" active />);
    expect(running.querySelector(".sc-roll")?.className).toContain(
      "sc-roll-ready",
    );
  });
});
