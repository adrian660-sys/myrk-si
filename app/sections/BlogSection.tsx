"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const posts = [
  {
    tag: "Travel",
    title: "Berlin: I went for an interview and came back with something else",
    excerpt:
      "I booked the flight 48 hours before. I didn't get the job. But I came back different — and that was the point.",
  },
  {
    tag: "Lifestyle",
    title: "Full-time job, freelance, sports presidency — this is the system",
    excerpt:
      "People ask how I do it all. Honestly? There's no secret. There's just a system, and the discipline to run it every day.",
  },
  {
    tag: "Leadership",
    title: "Floorball taught me PM. PM taught me how to coach.",
    excerpt:
      "The parallels between running a sports team and managing a project aren't metaphors. They're the same muscle.",
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
        <div ref={headlineRef} className="mb-14">
          <p className="font-sans text-xs tracking-[0.35em] uppercase text-[#c9a84c] mb-3">
            Blog
          </p>
          <h2 className="font-serif text-[clamp(2.5rem,5vw,4.5rem)] font-light text-dark leading-tight">
            Real stories.<br />Not LinkedIn posts.
          </h2>
        </div>

        <div ref={cardsRef} className="grid md:grid-cols-3 gap-[1px] border border-dark/10 overflow-hidden">
          {posts.map(({ tag, title, excerpt }) => (
            <article
              key={title}
              className="blog-card group relative bg-white hover:bg-[#f9f6f0] transition-colors duration-300 p-8 flex flex-col border-r border-dark/10 last:border-r-0"
            >
              {/* Draft badge */}
              <span className="absolute top-6 right-6 font-sans text-[10px] tracking-widest uppercase border border-dark/15 text-dark/40 px-2.5 py-1 rounded-full">
                Draft
              </span>

              <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#c9a84c] mb-4">
                {tag}
              </span>
              <h3 className="font-serif text-xl font-light text-dark leading-snug mb-4 group-hover:text-[#1a1a1a] transition-colors">
                {title}
              </h3>
              <p className="font-sans text-[13px] text-dark/50 leading-relaxed flex-1">
                {excerpt}
              </p>

              <div className="mt-6 pt-6 border-t border-dark/8">
                <span className="font-sans text-xs tracking-widest uppercase text-dark/30">
                  Coming soon
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
