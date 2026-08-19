import Image from "next/image";

const HERO_IMAGE_SRC = "/images/hero-landscape.webp";
const HERO_IMAGE_WIDTH = 1672;
const HERO_IMAGE_HEIGHT = 941;

export function HeroGlassFrame({ alt }: { alt: string }) {
  return (
    <div
      className="absolute inset-0 overflow-hidden md:top-[clamp(88px,11.5vh,126px)] md:right-[clamp(18px,5vw,112px)] md:bottom-[clamp(28px,5.5vh,76px)] md:left-[clamp(18px,5vw,112px)] md:rounded-[clamp(20px,1.9vw,30px)] md:p-3.5 md:shadow-[0_0_0_1px_rgba(255,255,255,0.85),0_0_0_1.6px_rgba(198,214,234,0.42),0_0_8px_0_rgba(210,224,240,0.5),0_1px_3px_-1px_rgba(15,23,42,0.08),0_22px_50px_-44px_rgba(15,23,42,0.16)]"
      aria-hidden
    >
      {/* Bezel: blurred artwork → glass pane → edge sheen → inner rim.
          Same src and sizes as the aperture below, so the two resolve to one
          srcset candidate and the browser fetches the artwork once. Preloading
          is the aperture's job — this layer is display:none until md. */}
      <Image
        src={HERO_IMAGE_SRC}
        alt=""
        width={HERO_IMAGE_WIDTH}
        height={HERO_IMAGE_HEIGHT}
        sizes="100vw"
        className="absolute inset-0 hidden h-full w-full scale-[1.2] rounded-[inherit] object-cover object-[center_45%] [filter:blur(40px)_saturate(72%)_brightness(1.2)] md:block"
      />
      <div
        className="absolute inset-0 hidden rounded-[inherit] [backdrop-filter:blur(64px)_saturate(104%)_brightness(1.2)] [-webkit-backdrop-filter:blur(64px)_saturate(104%)_brightness(1.2)] md:block"
        style={{
          background:
            "linear-gradient(155deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.22) 34%, rgba(255,255,255,0.2) 66%, rgba(255,255,255,0.36) 100%)",
        }}
      />
      <div
        className="absolute inset-0 hidden rounded-[inherit] md:block"
        style={{
          background:
            "linear-gradient(126deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.42) 4%, rgba(255,255,255,0.06) 11%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 88%, rgba(255,255,255,0.2) 96%, rgba(255,255,255,0.6) 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 top-0 hidden h-3.5 rounded-[inherit] md:block"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.14) 62%, rgba(255,255,255,0) 100%)",
        }}
      />
      <div className="absolute inset-0 hidden rounded-[inherit] shadow-[inset_0_1.5px_0.5px_rgba(255,255,255,0.98),inset_1.5px_0_0.5px_rgba(255,255,255,0.82),inset_-1.5px_0_0.5px_rgba(205,226,248,0.6),inset_0_-1.5px_0.5px_rgba(205,226,248,0.68),inset_0_0_0_1px_rgba(255,255,255,0.4),inset_0_-22px_30px_-24px_rgba(19,28,70,0.24)] md:block" />

      {/* Aperture: the artwork itself */}
      <div className="relative h-full w-full overflow-hidden md:rounded-[clamp(10px,1vw,16px)] md:bg-[#dbe7f4]">
        <Image
          src={HERO_IMAGE_SRC}
          alt={alt}
          width={HERO_IMAGE_WIDTH}
          height={HERO_IMAGE_HEIGHT}
          preload
          sizes="100vw"
          className="absolute inset-0 h-full w-full [mask-image:linear-gradient(180deg,#000_0%,#000_72%,rgba(0,0,0,0.55)_88%,rgba(0,0,0,0)_100%)] object-cover object-[center_42%] md:-top-3.5 md:-left-3.5 md:h-[calc(100%+28px)] md:w-[calc(100%+28px)] md:max-w-none md:[mask-image:none] md:object-[center_47%]"
        />
        <div className="absolute inset-0 hidden rounded-[inherit] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5),inset_0_1.5px_1px_rgba(255,255,255,0.55),inset_0_-1.5px_1px_rgba(255,255,255,0.32),inset_0_20px_34px_-28px_rgba(19,28,70,0.42),inset_0_-20px_34px_-28px_rgba(19,28,70,0.3),0_1px_3px_rgba(19,28,70,0.18)] md:block" />
      </div>
    </div>
  );
}
