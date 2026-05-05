"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const projects = [
  {
    label: "Market Research",
    title: "Slovenian SME Digital Adoption Study",
    description:
      "Comprehensive analysis of digital tool adoption across 50+ small and medium enterprises in Slovenia. Mapped pain points, vendor gaps, and ROI benchmarks.",
    tags: ["Research", "SMEs", "Digital"],
    status: "In progress",
  },
  {
    label: "Project Management",
    title: "Concert Tour — Nina Pušlar 2023/24",
    description:
      "End-to-end production management for a national concert tour. Coordinated venues, technical crews, ticketing partners, and media across 8 cities.",
    tags: ["Live Events", "Logistics", "Production"],
    status: "Completed",
  },
  {
    label: "Operations",
    title: "Šiškarji Floorball League Setup",
    description:
      "Designed and launched a competitive floorball league structure from scratch — rulebook, scheduling system, referee coordination, and venue partnerships.",
    tags: ["Sports", "Operations", "Volunteer"],
    status: "Ongoing",
  },
];

export default function WorkProjectsSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        sectionRef.current?.querySelectorAll(".proj-card") ?? [],
        { y: 40, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.65, stagger: 0.1, ease: "power2.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 78%" },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="projects"
      ref={sectionRef}
      className="bg-[#080808] py-24 md:py-32 px-6 md:px-14 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <p className="font-sans text-xs tracking-[0.35em] uppercase text-gold mb-3">Projects</p>
          <h2 className="font-serif text-[clamp(2rem,4vw,3.5rem)] font-light text-cream leading-tight">
            Selected work.
          </h2>
        </div>

        <div className="flex flex-col divide-y divide-cream/5 border border-cream/5">
          {projects.map(({ label, title, description, tags, status }) => (
            <div
              key={title}
              className="proj-card group px-6 py-8 hover:bg-cream/[0.03] transition-colors duration-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2.5 mb-2">
                    <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-gold/60">{label}</span>
                    <span
                      className={`font-sans text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full border ${
                        status === "Completed"
                          ? "border-green-500/20 text-green-400/60"
                          : status === "Ongoing"
                          ? "border-gold/20 text-gold/50"
                          : "border-cream/15 text-cream/35"
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                  <h3 className="font-serif text-xl font-light text-cream mb-3 leading-snug">{title}</h3>
                  <p className="font-sans text-[13px] text-cream/45 leading-relaxed max-w-xl">{description}</p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {tags.map((tag) => (
                      <span key={tag} className="font-sans text-[10px] tracking-wider uppercase text-cream/30 border border-cream/10 px-2.5 py-1">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
