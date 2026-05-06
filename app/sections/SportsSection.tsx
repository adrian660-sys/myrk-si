"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type SportIcon = (props: { className?: string }) => JSX.Element;

const FloorballIcon: SportIcon = ({ className }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    <circle cx="10.2" cy="3.8" r="1.6" stroke="currentColor" strokeWidth="1" />
    <path
      d="M9.1 4.9 3 11"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
    />
    <path
      d="M2.4 11.6 1.6 12.4"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
    />
  </svg>
);

const FootballIcon: SportIcon = ({ className }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    <circle cx="7" cy="7" r="5.4" stroke="currentColor" strokeWidth="1" />
    <path
      d="M7 4.4 9.2 6l-.85 2.6h-2.7L4.8 6 7 4.4Z"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinejoin="round"
    />
  </svg>
);

const BasketballIcon: SportIcon = ({ className }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    <circle cx="7" cy="7" r="5.4" stroke="currentColor" strokeWidth="1" />
    <path
      d="M1.6 7h10.8M7 1.6v10.8M3.2 3.2c2 1.5 2 6.1 0 7.6M10.8 3.2c-2 1.5-2 6.1 0 7.6"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
    />
  </svg>
);

const VolleyballIcon: SportIcon = ({ className }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    <circle cx="7" cy="7" r="5.4" stroke="currentColor" strokeWidth="1" />
    <path
      d="M2.5 4.4c2.7.5 6.5 2.5 7.8 7M11.4 4.1c-1.6 2.3-5.1 4.6-9.4 4.6M5.7 1.8C7 4.4 8.4 9 7.7 12.4"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
    />
  </svg>
);

const sportTags: { Icon: SportIcon; label: string }[] = [
  { Icon: FloorballIcon, label: "Floorball" },
  { Icon: FootballIcon, label: "Football" },
  { Icon: BasketballIcon, label: "Basketball" },
  { Icon: VolleyballIcon, label: "Volleyball" },
];

const stats = [
  { value: "8", label: "Years" },
  { value: "2017", label: "Founded" },
  { value: "4", label: "Sports" },
];

/**
 * Body-only Sports content. The page header lives in PageHero on /sports.
 */
export default function SportsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        contentRef.current?.querySelectorAll(".reveal") ?? [],
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: contentRef.current, start: "top 78%" },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="sports-body"
      data-section
      ref={sectionRef}
      className="section-light relative py-24 md:py-32 px-6 md:px-14 overflow-hidden"
      style={{ scrollMarginTop: "80px" }}
    >
      <div className="relative z-10 max-w-7xl mx-auto" ref={contentRef}>
        {/* Eyebrow */}
        <div className="mb-14 reveal">
          <p className="font-sans text-xs tracking-[0.35em] uppercase text-[#c9a84c] mb-3">
            By the numbers
          </p>
          <h2 className="font-serif text-[clamp(1.8rem,3.5vw,2.6rem)] font-light text-dark leading-tight max-w-2xl">
            Šiškarji — eight years of building a club that runs on culture
            instead of contracts.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-start">
          {/* Left — stat circles with glow */}
          <div className="flex flex-wrap gap-6 reveal">
            {stats.map(({ value, label }) => (
              <div
                key={label}
                className="group relative w-32 h-32 rounded-full border border-[#c9a84c]/25 flex flex-col items-center justify-center hover:border-[#c9a84c]/60 transition-colors duration-500"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full blur-xl bg-[#c9a84c]/0 group-hover:bg-[#c9a84c]/[0.08] transition-colors duration-500"
                />
                <span className="font-serif text-3xl font-light text-gold relative">
                  {value}
                </span>
                <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-dark/45 mt-1 relative">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Right — text */}
          <div className="flex flex-col gap-6 reveal">
            <p className="font-sans text-[16px] leading-[1.75] text-dark/70">
              I co-founded Šiškarji in 2017 — football, basketball, volleyball,
              floorball. Now focused on floorball. Building this taught me more
              about leadership than any job title.
            </p>
            <p className="font-sans text-[16px] leading-[1.75] text-dark/70">
              Running a sports association while working full-time isn&apos;t
              chaos. It&apos;s a system.
            </p>
            <p className="font-sans text-[16px] leading-[1.75] text-dark/70">
              The locker room and the boardroom aren&apos;t different. Both
              need someone who holds the vision when things get heavy.
            </p>

            {/* Quote */}
            <blockquote className="border-l-2 border-gold/40 pl-5 mt-2">
              <p className="font-serif text-[1.4rem] italic font-light text-gold/85 leading-snug">
                &ldquo;You don&apos;t lead from the bench.&rdquo;
              </p>
            </blockquote>

            {/* Sport tags */}
            <div className="flex flex-wrap gap-3 mt-2">
              {sportTags.map(({ Icon, label }) => (
                <span
                  key={label}
                  className="group inline-flex items-center gap-2.5 font-sans text-sm px-4 py-2 border border-dark/10 text-dark/65 bg-[#f9f6f0] rounded-full hover:border-[#c9a84c]/45 hover:text-dark transition-all duration-300 cursor-default"
                >
                  <Icon className="text-gold/75 group-hover:text-gold transition-colors duration-300" />
                  <span className="tracking-wide">{label}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
