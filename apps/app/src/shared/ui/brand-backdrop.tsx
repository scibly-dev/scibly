/** The brand backdrop from the marketing pages: soft blooms over ruled ground. */
export function BrandBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute -top-64 left-[8%] h-[520px] w-[520px] rounded-full bg-[#e8f2ff]/75 blur-[120px]" />
      <div className="absolute top-[32%] -right-56 h-[520px] w-[520px] rounded-full bg-[#e8faf5]/60 blur-[130px]" />
      <div className="absolute bottom-[8%] -left-52 h-[460px] w-[460px] rounded-full bg-[#f1ecff]/55 blur-[130px]" />
      <div
        className="absolute inset-0 opacity-25 md:opacity-30 lg:opacity-35"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='68' height='68' viewBox='0 0 68 68' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 68 0 L 0 0 0 68' fill='none' stroke='%23cbd5e1' stroke-opacity='.52' stroke-width='1'/%3E%3C/svg%3E\")",
          backgroundSize: "68px 68px",
          backgroundPosition: "0 34px",
        }}
      />
    </div>
  );
}
