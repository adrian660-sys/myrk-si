"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import dynamic from "next/dynamic";

const ParticleCanvas = dynamic(
  () => import("@/app/components/ParticleCanvas"),
  { ssr: false }
);

type Props = {
  eyebrow: string;
  watermark: string;
  /** First line of headline (rendered cream) */
  titleTop: string;
  /** Second line of headline (rendered gold) */
  titleBottom: string;
  sub?: string;
};

/**
 * Reusable page hero for /work, /sports, /notebook.
 * Particle canvas + ghost-text watermark + word-by-word fade-in headline.
 */
export default function PageHero({
  eyebrow,
  watermark,
  titleTop,
  titleBottom,
  sub,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const blocks = Array.from(
      ref.current.querySelectorAll<HTMLElement>(".reveal")
    );
    const words = Array.from(
      ref.current.querySelectorAll<HTMLElement>(".word")
    );

    gsap.set([...blocks, ...words], { opacity: 0, y: 32 });

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.to(blocks.slice(0, 1), {
      opacity: 1,
      y: 0,
      duration: 0.7,
    })
      .to(
        words,
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.09,
        },
        "-=0.2"
      )
      .to(
        blocks.slice(1),
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.1,
        },
        "-=0.4"
      );
  }, []);

  const splitWords = (text: string) =>
    text.split(" ").map((w, i) => (
      <span key={`${w}-${i}`} className="inline-block overflow-hidden">
        <span className="word inline-block">
          {w}
          {i < text.split(" ").length - 1 ? "\u00A0" : ""}
        </span>
      </span>
    ));

  return (
    <section
      data-section
      className="relative w-full min-h-[78vh] bg-[#080808] overflow-hidden flex flex-col"
      style={{ scrollMarginTop: "80px" }}
    >
      <ParticleCanvas />

      {/* Vignette + bottom fade */}
      <div className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_30%,#080808_100%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-40 z-[1] bg-gradient-to-t from-[#080808] to-transparent" />

      {/* Ghost watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[1] font-serif font-bold leading-none tracking-[0.04em] text-cream/[0.028] whitespace-nowrap select-none"
        style={{ fontSize: "clamp(6.5rem, 21vw, 21rem)" }}
      >
        {watermark}
      </div>

      {/* Text */}
      <div
        ref={ref}
        className="relative z-10 flex-1 flex flex-col justify-end px-6 md:px-14 pt-36 pb-24 md:pb-28 max-w-7xl mx-auto w-full"
      >
        <p className="reveal font-sans text-xs tracking-[0.35em] uppercase text-gold mb-4">
          {eyebrow}
        </p>

        <h1 className="font-serif text-[clamp(2.8rem,8vw,7rem)] font-light leading-[1.02] tracking-tight text-cream mb-6">
          <span className="block">{splitWords(titleTop)}</span>
          <span className="block text-gold">{splitWords(titleBottom)}</span>
        </h1>

        {sub && (
          <p className="reveal font-sans text-[16px] md:text-[17px] t-cream-muted font-light max-w-xl leading-relaxed">
            {sub}
          </p>
        )}
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-cream/25">
          Scroll
        </span>
        <div className="w-px h-10 bg-gradient-to-b from-cream/25 to-transparent animate-scroll-bounce" />
      </div>
    </section>
  );
}
