"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const sportTags = [
  { icon: "🏒", label: "Floorball" },
  { icon: "⚽", label: "Football" },
  { icon: "🏀", label: "Basketball" },
  { icon: "🏐", label: "Volleyball" },
];

const stats = [
  { value: "8", label: "Years" },
  { value: "2017", label: "Founded" },
  { value: "4", label: "Sports" },
];

export default function SportsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const watermarkRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        watermarkRef.current,
        { x: -80, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1.5,
          ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
        }
      );
      gsap.fromTo(
        contentRef.current?.querySelectorAll(".reveal") ?? [],
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: contentRef.current, start: "top 75%" },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="sports"
      data-section
      ref={sectionRef}
      className="section-dark relative py-24 md:py-36 px-6 md:px-14 overflow-hidden"
      style={{ scrollMarginTop: "80px" }}
    >
      {/* Watermark */}
      <div
        ref={watermarkRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-serif font-bold text-[clamp(5rem,18vw,18rem)] leading-none tracking-widest text-cream/[0.025] whitespace-nowrap select-none pointer-events-none z-0"
        aria-hidden="true"
      >
        ŠIŠKARJI
      </div>

      <div className="relative z-10 max-w-7xl mx-auto" ref={contentRef}>
        {/* Header */}
        <div className="mb-16 reveal">
          <p className="font-sans text-xs tracking-[0.35em] uppercase text-gold mb-3">Sports</p>
          <h2 className="font-serif text-[clamp(2.5rem,5vw,4.5rem)] font-light text-cream leading-tight">
            Culture beats rules.<br />Always.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-start">
          {/* Left — stat circles */}
          <div className="flex flex-wrap gap-6 reveal">
            {stats.map(({ value, label }) => (
              <div
                key={label}
                className="relative w-32 h-32 rounded-full border border-gold/20 flex flex-col items-center justify-center hover:border-gold/50 transition-colors duration-300"
              >
                <span className="font-serif text-3xl font-light text-gold">{value}</span>
                <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-cream/40 mt-1">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Right — text */}
          <div className="flex flex-col gap-6 reveal">
            <p className="font-sans text-[15px] leading-relaxed text-cream/70">
              I co-founded Šiškarji in 2017 — football, basketball, volleyball, floorball. Now focused on floorball. Building this taught me more about leadership than any job title.
            </p>
            <p className="font-sans text-[15px] leading-relaxed text-cream/70">
              Running a sports association while working full-time isn't chaos. It's a system.
            </p>
            <p className="font-sans text-[15px] leading-relaxed text-cream/70">
              The locker room and the boardroom aren't different. Both need someone who holds the vision when things get heavy.
            </p>

            {/* Quote */}
            <blockquote className="border-l-2 border-gold/30 pl-5 mt-2">
              <p className="font-serif text-xl italic font-light text-gold/80">
                "In floorball I learned PM. In PM, I learned how to coach."
              </p>
            </blockquote>

            {/* Sport tags */}
            <div className="flex flex-wrap gap-3 mt-2">
              {sportTags.map(({ icon, label }) => (
                <span
                  key={label}
                  className="font-sans text-sm px-4 py-2 border border-cream/10 text-cream/60 rounded-full hover:border-gold/30 hover:text-cream/80 transition-all duration-300 cursor-default"
                >
                  {icon} {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
