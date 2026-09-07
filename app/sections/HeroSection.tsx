"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import dynamic from "next/dynamic";

const ParticleCanvas = dynamic(
  () => import("@/app/components/ParticleCanvas"),
  { ssr: false }
);

export default function HeroSection() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!wrapRef.current) return;
    const blocks = Array.from(
      wrapRef.current.querySelectorAll<HTMLElement>(".reveal")
    );
    const words = Array.from(
      wrapRef.current.querySelectorAll<HTMLElement>(".word")
    );

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReduced) {
      gsap.set([...blocks, ...words], { opacity: 1, y: 0 });
      return;
    }

    gsap.set([...blocks, ...words], { opacity: 0, y: 40 });

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.to(blocks.slice(0, 2), {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.12,
      delay: 0.2,
    })
      .to(
        words,
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.11,
        },
        "-=0.2"
      )
      .to(
        blocks.slice(2),
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.12,
        },
        "-=0.4"
      );
  }, []);

  const scrollToContact = (e: React.MouseEvent) => {
    e.preventDefault();
    document
      .getElementById("contact")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero"
      data-section
      className="relative w-full h-screen min-h-[640px] bg-[#080808] overflow-hidden flex flex-col"
    >
      <ParticleCanvas />

      {/* Vignette */}
      <div className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_30%,#080808_92%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-44 z-[1] bg-gradient-to-t from-[#080808] to-transparent" />

      {/* Ghost watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[1] font-serif font-bold leading-none tracking-[0.04em] text-cream/[0.025] whitespace-nowrap select-none"
        style={{ fontSize: "clamp(8rem, 26vw, 26rem)" }}
      >
        MYRK
      </div>

      {/* Text content */}
      <div
        ref={wrapRef}
        className="relative z-10 flex-1 flex flex-col justify-end px-6 md:px-14 pb-20 md:pb-24 max-w-7xl mx-auto w-full"
      >
        <p className="reveal font-sans text-xs tracking-[0.35em] uppercase text-gold mb-3">
          Ljubljana · Slovenia
        </p>

        <p className="reveal font-serif text-base tracking-[0.2em] text-cream/60 mb-4">
          Adrian Džeka
        </p>

        <h1 className="font-serif text-[clamp(2.8rem,8vw,7.5rem)] font-light leading-[1.02] tracking-tight text-cream mb-6">
          <span className="block">
            <span className="inline-block overflow-hidden">
              <span className="word inline-block">People&nbsp;</span>
            </span>
            <span className="inline-block overflow-hidden">
              <span className="word inline-block">first.</span>
            </span>
          </span>
          <span className="inline-block overflow-hidden">
            <span className="word inline-block text-gold">Always.</span>
          </span>
        </h1>

        <p className="reveal font-sans text-[15px] md:text-[17px] t-cream-muted font-light max-w-md mb-9 leading-relaxed">
          Project manager who reads the room, not just the brief.
        </p>

        <div className="reveal flex flex-wrap gap-3">
          <button
            onClick={scrollToContact}
            className="group inline-flex items-center gap-3 min-h-[48px] px-7 py-3 rounded-full text-[#080808] font-sans font-medium text-sm tracking-[0.15em] uppercase transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(201,168,76,0.35)]"
            style={{
              background:
                "linear-gradient(135deg, #c9a84c 0%, #e0c170 50%, #c9a84c 100%)",
            }}
          >
            <span>Let&apos;s talk</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className="transition-transform duration-300 group-hover:translate-x-1"
            >
              <path
                d="M2 7h10M8 3l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              router.push("/work");
            }}
            className="min-h-[48px] px-7 py-3 rounded-full border border-cream/25 text-cream font-sans font-light text-sm tracking-[0.15em] uppercase hover:border-cream/55 hover:bg-cream/5 transition-all duration-300"
          >
            See my work
          </button>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-cream/25">
          Scroll
        </span>
        <div className="w-px h-10 bg-gradient-to-b from-cream/25 to-transparent animate-scroll-bounce motion-reduce:animate-none" />
      </div>
    </section>
  );
}
