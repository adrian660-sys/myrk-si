"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import dynamic from "next/dynamic";

const ParticleCanvas = dynamic(() => import("@/app/components/ParticleCanvas"), {
  ssr: false,
});

export default function HeroSection() {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!textRef.current) return;
    const els = textRef.current.querySelectorAll(".reveal");
    gsap.fromTo(
      els,
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1.1,
        stagger: 0.15,
        ease: "power3.out",
        delay: 0.4,
      }
    );
  }, []);

  const scrollToAbout = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToContact = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero"
      className="relative w-full h-screen min-h-[600px] bg-[#080808] overflow-hidden flex flex-col"
    >
      <ParticleCanvas />

      {/* Gradient vignette */}
      <div className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_30%,#080808_90%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-32 z-[1] bg-gradient-to-t from-[#080808] to-transparent" />

      {/* Content */}
      <div
        ref={textRef}
        className="relative z-10 flex-1 flex flex-col justify-end px-8 md:px-14 pb-20 md:pb-24"
      >
        {/* Tagline */}
        <p className="reveal font-sans text-xs tracking-[0.35em] uppercase text-gold mb-4">
          Ljubljana · Slovenia
        </p>

        {/* Headline */}
        <h1 className="reveal font-serif text-[clamp(3.5rem,9vw,7.5rem)] font-light leading-none tracking-tight text-cream mb-4">
          People first.<br />
          <em className="text-gold/90 not-italic">Always.</em>
        </h1>

        {/* Subline */}
        <p className="reveal font-sans text-base md:text-lg text-cream/60 font-light max-w-md mb-8">
          Project manager who reads the room, not just the brief.
        </p>

        {/* CTAs */}
        <div className="reveal flex flex-wrap gap-4">
          <button
            onClick={scrollToContact}
            className="px-7 py-3 rounded-full bg-gold text-[#080808] font-sans font-medium text-sm tracking-widest uppercase hover:bg-gold-light transition-colors duration-300"
          >
            Get in touch
          </button>
          <button
            onClick={scrollToAbout}
            className="px-7 py-3 rounded-full border border-cream/30 text-cream font-sans font-light text-sm tracking-widest uppercase hover:border-cream/60 hover:bg-cream/5 transition-all duration-300"
          >
            See my work
          </button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-cream/30">Scroll</span>
        <div className="w-[1px] h-10 bg-gradient-to-b from-cream/30 to-transparent animate-scroll-bounce" />
      </div>
    </section>
  );
}
