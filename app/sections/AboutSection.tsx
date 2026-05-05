"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(
        sectionRef.current?.querySelectorAll(".anim") ?? [],
        {
          y: 35,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          clearProps: "all",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 88%",
            toggleActions: "play none none none",
          },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="about"
      data-section
      ref={sectionRef}
      className="bg-white py-12 md:py-20 px-6 md:px-14 overflow-hidden"
      style={{ scrollMarginTop: "80px" }}
    >
      <div className="max-w-7xl mx-auto">
        {/*
          Two-column: photo LEFT, all copy RIGHT.
          Mobile: copy first (order-1), photo below (order-2).
          Desktop: photo left (md:order-1), copy right (md:order-2).
        */}
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">

          {/* ── LEFT: photo placeholder ── */}
          <div className="anim order-2 md:order-1">
            <div
              className="w-full aspect-[4/5] max-w-[400px] flex flex-col items-center justify-center gap-3"
              style={{ background: "#111111", border: "1px solid #c9a84c" }}
            >
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
                <rect x="6" y="6" width="32" height="32" rx="2" stroke="#c9a84c" strokeWidth="1.2" />
                <circle cx="22" cy="18" r="5.5" stroke="#c9a84c" strokeWidth="1.2" />
                <path d="M6 36c0-8.284 7.163-11 16-11s16 2.716 16 11" stroke="#c9a84c" strokeWidth="1.2" />
              </svg>
              <p className="font-sans text-xs tracking-[0.25em] uppercase text-[#f0e8d5]">
                Photo coming soon
              </p>
              <p className="font-sans text-[11px] tracking-wider text-[#f0e8d5]/35">
                Replace with adrian.jpg
              </p>
            </div>
          </div>

          {/* ── RIGHT: label + headline + copy + quotes ── */}
          <div className="anim order-1 md:order-2 flex flex-col gap-5">
            <p className="font-sans text-xs tracking-[0.35em] uppercase text-[#c9a84c]">
              About
            </p>
            <h2 className="font-serif text-[clamp(2.4rem,5vw,4.5rem)] font-light leading-[1.05] text-[#1a1a1a]">
              Built from<br />a dark place.
            </h2>
            <div className="w-10 h-px bg-[#1a1a1a]/15" />
            <p className="font-serif text-base italic font-light text-[#1a1a1a]/45 leading-relaxed">
              "I run myrk. because I choose who I work with."
            </p>

            <div className="flex flex-col gap-4 mt-1">
              <p className="font-sans text-[15px] leading-[1.75] text-[#1a1a1a]/65">
                I'm Adrian — project manager, sole proprietor, and sports president based in Ljubljana. Before I ask what you want, I need to understand who you are. That's how I work.
              </p>
              <p className="font-sans text-[15px] leading-[1.75] text-[#1a1a1a]/65">
                I built Šiškarji from zero. I managed concert tours from the side of the stage. I flew solo to Berlin for an interview just to see what I was made of. Everything I know, I learned by doing.
              </p>
              <p className="font-sans text-[15px] leading-[1.75] text-[#1a1a1a]/65">
                When a project goes wrong, I don't look for someone to blame — I call the team and we fix it together.
              </p>
            </div>

            <p className="font-serif text-[1.1rem] italic font-light text-[#c9a84c] leading-snug mt-1">
              "How you do one thing is how you do everything."
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
