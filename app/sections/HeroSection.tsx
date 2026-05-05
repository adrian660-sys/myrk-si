"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import dynamic from "next/dynamic";

const ParticleCanvas = dynamic(() => import("@/app/components/ParticleCanvas"), {
  ssr: false,
});

export default function HeroSection() {
  const textRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!textRef.current) return;
    const els = Array.from(textRef.current.querySelectorAll<HTMLElement>(".reveal"));
    // Set visible first (fixes blank-on-reload), then animate
    gsap.set(els, { opacity: 0, y: 40 });
    gsap.to(els, {
      opacity: 1,
      y: 0,
      duration: 1,
      stagger: 0.13,
      ease: "power3.out",
      delay: 0.3,
    });
  }, []);

  const scrollToContact = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero"
      data-section
      className="relative w-full h-screen min-h-[600px] bg-[#080808] overflow-hidden flex flex-col"
      style={{ scrollMarginTop: "80px" }}
    >
      <ParticleCanvas />

      {/* Vignette */}
      <div className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_30%,#080808_90%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-40 z-[1] bg-gradient-to-t from-[#080808] to-transparent" />

      {/* Text content */}
      <div
        ref={textRef}
        className="relative z-10 flex-1 flex flex-col justify-end px-6 md:px-14 pb-20 md:pb-24"
      >
        <p className="reveal font-sans text-xs tracking-[0.35em] uppercase text-gold mb-3">
          Ljubljana · Slovenia
        </p>

        <p className="reveal font-serif text-base tracking-[0.2em] text-cream/60 mb-3">
          Adrian Džeka
        </p>

        <h1 className="reveal font-serif text-[clamp(2.8rem,8vw,7.5rem)] font-light leading-[1.02] tracking-tight text-cream mb-5">
          People first.<br />
          <em className="text-gold not-italic">Always.</em>
        </h1>

        <p className="reveal font-sans text-sm md:text-base text-cream/55 font-light max-w-sm mb-8 leading-relaxed">
          Project manager who reads the room, not just the brief.
        </p>

        <div className="reveal flex flex-wrap gap-3">
          <button
            onClick={scrollToContact}
            className="min-h-[44px] px-7 py-3 rounded-full bg-gold text-[#080808] font-sans font-medium text-sm tracking-[0.15em] uppercase hover:bg-gold-light transition-colors duration-300"
          >
            Get in touch
          </button>
          <button
            onClick={(e) => { e.preventDefault(); router.push("/work"); }}
            className="min-h-[44px] px-7 py-3 rounded-full border border-cream/25 text-cream font-sans font-light text-sm tracking-[0.15em] uppercase hover:border-cream/50 hover:bg-cream/5 transition-all duration-300"
          >
            See my work
          </button>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-cream/25">Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-cream/25 to-transparent animate-scroll-bounce" />
      </div>
    </section>
  );
}
