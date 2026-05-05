"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const cities = [
  { name: "Berlin", country: "Germany", code: "DE" },
  { name: "Copenhagen", country: "Denmark", code: "DK" },
  { name: "Bratislava", country: "Slovakia", code: "SK" },
  { name: "Zurich", country: "Switzerland", code: "CH" },
  { name: "Stockholm", country: "Sweden", code: "SE" },
  { name: "Prague", country: "Czechia", code: "CZ" },
  { name: "Zagreb", country: "Croatia", code: "HR" },
];

const counters = [
  { end: 7, label: "Cities" },
  { end: 6, label: "Countries" },
  { end: 18, label: "Months" },
];

function AnimatedCounter({ end, label }: { end: number; label: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const triggered = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      onEnter: () => {
        if (triggered.current) return;
        triggered.current = true;
        const obj = { val: 0 };
        gsap.to(obj, {
          val: end,
          duration: 1.5,
          ease: "power2.out",
          onUpdate: () => {
            if (el) el.textContent = Math.round(obj.val).toString();
          },
        });
      },
    });
    return () => st.kill();
  }, [end]);

  return (
    <div className="text-center">
      <div className="font-serif text-[clamp(3rem,8vw,6rem)] font-light text-dark leading-none">
        <span ref={ref}>0</span>
      </div>
      <p className="font-sans text-xs tracking-[0.25em] uppercase text-dark/40 mt-2">{label}</p>
    </div>
  );
}

export default function TravelSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headlineRef.current,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: headlineRef.current, start: "top 80%" },
        }
      );
      gsap.fromTo(
        cardsRef.current?.querySelectorAll(".city-card") ?? [],
        { y: 40, opacity: 0, scale: 0.96 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: { trigger: cardsRef.current, start: "top 80%" },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="travel"
      ref={sectionRef}
      className="section-light py-24 md:py-36 px-6 md:px-14 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div ref={headlineRef} className="mb-16 max-w-2xl">
          <h2 className="font-serif text-[clamp(2.5rem,5vw,4.5rem)] font-light text-dark leading-tight mb-5">
            7 cities.<br />Every one a reason.
          </h2>
          <p className="font-sans text-[15px] text-dark/60 leading-relaxed">
            In the last year and a half, Europe has been my office. Not tourism — every trip was a meeting, a project, a next step.
          </p>
        </div>

        {/* Counters */}
        <div className="grid grid-cols-3 gap-px border border-dark/10 mb-16 overflow-hidden">
          {counters.map(({ end, label }) => (
            <div key={label} className="bg-[#f9f6f0] py-10 px-4">
              <AnimatedCounter end={end} label={label} />
            </div>
          ))}
        </div>

        {/* City cards */}
        <div ref={cardsRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
          {cities.map(({ name, country, code }) => (
            <div
              key={name}
              className="city-card group relative border border-dark/10 p-6 hover:-translate-y-1 transition-transform duration-300 cursor-default overflow-hidden"
            >
              {/* Gold underline on hover */}
              <span aria-hidden="true" className="absolute bottom-0 left-0 h-[2px] w-0 bg-gold group-hover:w-full transition-all duration-[400ms]" />
              {/* Country code corner stamp */}
              <span className="absolute top-4 right-4 font-serif italic text-sm tracking-wider text-[#c9a84c]/70">
                {code}
              </span>
              <div className="flex items-baseline gap-2 mt-2 mb-1">
                <span aria-hidden="true" className="block w-5 h-px bg-gold/50" />
                <p className="font-serif text-xl font-light text-dark leading-none">{name}</p>
              </div>
              <p className="font-sans text-[11px] text-dark/45 tracking-[0.2em] uppercase mt-2">
                {country}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
