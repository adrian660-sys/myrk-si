"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const posts = [
  {
    no: "N° 01",
    tag: "Travel",
    title: "Berlin: I went for an interview and came back with something else",
    excerpt:
      "I booked the flight 48 hours before. I didn't get the job. But I came back different — and that was the point.",
    estimated: "Spring 2026",
  },
  {
    no: "N° 02",
    tag: "Lifestyle",
    title: "Full-time job, freelance, sports presidency — this is the system",
    excerpt:
      "People ask how I do it all. Honestly? There's no secret. There's just a system, and the discipline to run it every day.",
    estimated: "Summer 2026",
  },
  {
    no: "N° 03",
    tag: "Leadership",
    title: "Floorball taught me PM. PM taught me how to coach.",
    excerpt:
      "The parallels between running a sports team and managing a project aren't metaphors. They're the same muscle.",
    estimated: "Autumn 2026",
  },
];

export default function BlogSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headlineRef.current,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: headlineRef.current, start: "top 80%" },
        }
      );
      gsap.fromTo(
        cardsRef.current?.querySelectorAll(".blog-card") ?? [],
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.12,
          ease: "power2.out",
          scrollTrigger: { trigger: cardsRef.current, start: "top 80%" },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="blog"
      ref={sectionRef}
      className="section-light py-24 md:py-36 px-6 md:px-14 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        <div ref={headlineRef} className="mb-14 max-w-2xl">
          <p className="font-sans text-xs tracking-[0.35em] uppercase text-[#c9a84c] mb-3">
            Essays
          </p>
          <h2 className="font-serif text-[clamp(2rem,4vw,3.5rem)] font-light text-dark leading-tight mb-5">
            Three pieces, written slowly.
          </h2>
          <p className="font-sans text-[16px] t-ink-muted leading-relaxed">
            Each one earns its publish date — no hot takes, no engagement bait.
            Stories from the road, the locker room, and the production office.
          </p>
        </div>

        <div ref={cardsRef} className="grid md:grid-cols-3 gap-[1px] border border-dark/10 overflow-hidden">
          {posts.map(({ no, tag, title, excerpt, estimated }) => (
            <article
              key={title}
              className="blog-card group relative bg-[#f9f6f0] hover:bg-white transition-colors duration-300 p-8 flex flex-col border-r border-dark/10 last:border-r-0"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="font-serif italic text-sm text-[#c9a84c]/80">
                  {no}
                </span>
                <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-dark/40">
                  {tag}
                </span>
              </div>

              <h3 className="font-serif text-xl font-light text-dark leading-snug mb-4 group-hover:text-[#1a1a1a] transition-colors">
                {title}
              </h3>
              <p className="font-sans text-[13px] t-ink-muted leading-relaxed flex-1">
                {excerpt}
              </p>

              <div className="mt-8 pt-5 border-t border-dark/10 flex items-center justify-between">
                <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-dark/40">
                  {estimated}
                </span>
                <span className="font-serif italic text-xs text-dark/35">
                  in progress
                </span>
              </div>
            </article>
          ))}
        </div>

        {/* Subscribe rail */}
        <div className="mt-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 border-t border-dark/10 pt-8">
          <p className="font-serif italic text-base text-dark/65 max-w-md">
            Get a quiet note when the first essay drops.
          </p>
          <a
            href="mailto:adrian@myrk.si?subject=Notebook%20%E2%80%94%20notify%20me"
            className="self-start sm:self-auto font-sans text-xs tracking-[0.25em] uppercase text-[#c9a84c] border-b border-[#c9a84c]/40 hover:border-[#c9a84c] pb-1 transition-colors"
          >
            adrian@myrk.si &nbsp;→
          </a>
        </div>
      </div>
    </section>
  );
}
