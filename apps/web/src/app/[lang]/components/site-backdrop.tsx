export function SiteBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[#fbfcff]" />
      <div className="absolute -top-64 left-[8%] h-[520px] w-[520px] rounded-full bg-[#e8f2ff]/75 blur-[120px]" />
      <div className="absolute top-[32%] -right-56 h-[520px] w-[520px] rounded-full bg-[#e8faf5]/60 blur-[130px]" />
      <div className="absolute bottom-[8%] -left-52 h-[460px] w-[460px] rounded-full bg-[#f1ecff]/55 blur-[130px]" />
    </div>
  );
}
