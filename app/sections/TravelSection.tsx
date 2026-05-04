"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const cities = [
  { name: "Berlin", country: "Germany", flag: "🇩🇪" },
  { name: "Copenhagen", country: "Denmark", flag: "🇩🇰" },
  { name: "Bratislava", country: "Slovakia", flag: "🇸🇰" },
  { name: "Zurich", country: "Switzerland", flag: "🇨🇭" },
  { name: "Stockholm", country: "Sweden", flag: "🇸🇪" },
  { name: "Prague", country: "Czechia", flag: "🇨🇿" },
  { name: "Zagreb", country: "Croatia", flag: "🇭🇷" },
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
          {cities.map(({ name, country, flag }) => (
            <div
              key={name}
              className="city-card group relative border border-dark/10 p-6 hover:-translate-y-1 transition-transform duration-300 cursor-default overflow-hidden"
            >
              {/* Gold underline on hover */}
              <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-gold group-hover:w-full transition-all duration-400" />
              <div className="text-3xl mb-3">{flag}</div>
              <p className="font-serif text-xl font-light text-dark mb-0.5">{name}</p>
              <p className="font-sans text-xs text-dark/40 tracking-wider uppercase">{country}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
