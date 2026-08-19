import "react";

declare module "react" {
  /**
   * The marketing pages drive their colours through CSS custom properties, so a
   * `style` object legitimately carries `--*` keys that React's own typings stop
   * at. Declaring them here is what lets those objects be written plainly
   * instead of asserted past the checker.
   */
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}
