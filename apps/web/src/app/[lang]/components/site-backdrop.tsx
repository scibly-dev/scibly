export function SiteBackdrop() {
  // Plain radial gradients instead of blurred divs: `filter: blur()` inside a
  // fixed full-viewport layer is re-rasterised at device pixel ratio on iOS
  // and competes with content tiles during scroll, leaving blank areas.
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 bg-[#fbfcff] bg-[radial-gradient(360px_360px_at_calc(8%+260px)_-10px,rgba(232,242,255,0.75)_0%,rgba(232,242,255,0)_70%),radial-gradient(360px_360px_at_calc(100%+30px)_calc(32%+260px),rgba(232,250,245,0.6)_0%,rgba(232,250,245,0)_70%),radial-gradient(320px_320px_at_-20px_calc(92%-230px),rgba(241,236,255,0.55)_0%,rgba(241,236,255,0)_70%)]"
      aria-hidden
    />
  );
}
