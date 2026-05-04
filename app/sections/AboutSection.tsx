"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { value: "7+", label: "Years leading Šiškarji" },
  { value: "7", label: "Business trips" },
  { value: "4", label: "Languages" },
  { value: "10+", label: "Projects" },
];

export default function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLQuoteElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
          end: "bottom 20%",
          toggleActions: "play none none none",
        },
      });

      tl.fromTo(
        headlineRef.current,
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
      )
        .fromTo(
          textRef.current?.querySelectorAll("p") ?? [],
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: "power2.out" },
          "-=0.5"
        )
        .fromTo(
          photoRef.current,
          { scale: 0.95, opacity: 0 },
          { scale: 1, opacity: 1, duration: 1, ease: "power2.out" },
          "-=0.8"
        )
        .fromTo(
          quoteRef.current,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" },
          "-=0.4"
        )
        .fromTo(
          statsRef.current?.querySelectorAll(".stat-item") ?? [],
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out" },
          "-=0.3"
        );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="about"
      ref={sectionRef}
      className="section-light py-24 md:py-36 px-6 md:px-14 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        {/* Top grid */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 mb-16">
          {/* Left — headline */}
          <div>
            <h2
              ref={headlineRef}
              className="font-serif text-[clamp(2.8rem,6vw,5.5rem)] font-light leading-tight text-dark"
            >
              Built from<br />a dark place.
            </h2>
          </div>

          {/* Right — body text */}
          <div ref={textRef} className="flex flex-col justify-center gap-5">
            <p className="font-sans text-[15px] leading-relaxed text-dark/70">
              I'm Adrian — project manager, sole proprietor, and sports president based in Ljubljana. Before I ask what you want, I need to understand who you are. That's how I work.
            </p>
            <p className="font-sans text-[15px] leading-relaxed text-dark/70">
              I built Šiškarji from zero. I managed concert tours from the side of the stage. I flew solo to Berlin for an interview just to see what I was made of. Everything I know, I learned by doing.
            </p>
            <p className="font-sans text-[15px] leading-relaxed text-dark/70">
              I run myrk. because I choose who I work with. My clients have a vision. They trust me to execute it. When a project goes wrong, I don't look for someone to blame — I call the team and we fix it together.
            </p>
          </div>
        </div>

        {/* Photo + quote row */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 mb-16 items-end">
          {/* Photo placeholder */}
          <div
            ref={photoRef}
            className="w-full max-w-[400px] mx-auto md:mx-0 aspect-[5/7] border border-dark/10 rounded-sm flex flex-col items-center justify-center bg-[#f5f1eb] relative overflow-hidden"
          >
            <div className="absolute inset-0 border-[6px] border-[#080808]/5" />
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mb-4 opacity-30">
              <rect x="8" y="8" width="32" height="32" rx="2" stroke="#1a1a1a" strokeWidth="1.5" />
              <circle cx="24" cy="20" r="6" stroke="#1a1a1a" strokeWidth="1.5" />
              <path d="M8 38c0-8.837 7.163-12 16-12s16 3.163 16 12" stroke="#1a1a1a" strokeWidth="1.5" />
            </svg>
            <p className="font-sans text-sm text-dark/40 tracking-widest uppercase">Photo coming soon</p>
            <p className="font-sans text-xs text-dark/25 mt-1 tracking-wider">Replace with adrian.jpg</p>
            <div className="absolute inset-0 border border-[#c9a84c]/20" />
          </div>

          {/* Quote */}
          <blockquote ref={quoteRef} className="flex flex-col justify-end">
            <p className="font-serif text-[clamp(1.4rem,3vw,2.2rem)] italic font-light text-[#c9a84c] leading-relaxed">
              "How you do one thing is how you do everything."
            </p>
          </blockquote>
        </div>

        {/* Stats */}
        <div
          ref={statsRef}
          className="grid grid-cols-2 md:grid-cols-4 gap-px border border-dark/10 overflow-hidden"
        >
          {stats.map(({ value, label }) => (
            <div
              key={label}
              className="stat-item bg-white py-8 px-6 text-center hover:bg-[#f9f6f0] transition-colors duration-300"
            >
              <p className="font-serif text-[clamp(2rem,5vw,3.5rem)] font-light text-dark mb-1">
                {value}
              </p>
              <p className="font-sans text-[11px] tracking-[0.15em] uppercase text-dark/50">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
