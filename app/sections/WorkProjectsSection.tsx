"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const projects = [
  {
    label: "Live Production",
    title: "Concert Tour — Nina Pušlar 2023/24",
    description:
      "End-to-end production management for a national concert tour. Coordinated venues, technical crews, ticketing partners, and media across 8 cities. Zero missed cues, zero blown budgets.",
    tags: ["Live Events", "Logistics", "Production"],
    status: "Completed",
  },
  {
    label: "Project Management",
    title: "Corner Invest — Project Pipeline",
    description:
      "Leading end-to-end project delivery. Stakeholder coordination, timeline management, and closing discipline across multiple concurrent initiatives.",
    tags: ["PM", "Stakeholders", "Closing"],
    status: "Ongoing",
  },
  {
    label: "Healthcare Ops",
    title: "IMŠ Clinic — Workflow Restructure",
    description:
      "Streamlined administrative workflows and patient scheduling for a private medical clinic. Cut handover friction, tightened patient flow, set up a system the staff actually uses.",
    tags: ["Operations", "Workflow", "Healthcare"],
    status: "Completed",
  },
  {
    label: "Sports Operations",
    title: "Šiškarji Floorball League — Build From Zero",
    description:
      "Designed and launched a competitive floorball league structure from scratch — rulebook, scheduling system, referee coordination, venue partnerships. Now in its third running season.",
    tags: ["Sports", "Operations", "Volunteer"],
    status: "Ongoing",
  },
  {
    label: "Creative Production",
    title: "NYD — Cross-Functional Production",
    description:
      "Oversaw creative and production projects for an agency, managing cross-functional teams and client relationships from brief to final delivery. Multiple campaigns, multiple clients, one standard.",
    tags: ["Creative", "Cross-Functional", "Agency"],
    status: "Completed",
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
          y: 0,
          opacity: 1,
          duration: 0.65,
          stagger: 0.08,
          ease: "power2.out",
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
          <p className="font-sans text-xs tracking-[0.35em] uppercase text-gold mb-3">
            Projects
          </p>
          <h2 className="font-serif text-[clamp(2rem,4vw,3.5rem)] font-light text-cream leading-tight">
            Selected work.
          </h2>
        </div>

        <div className="flex flex-col divide-y divide-cream/5 border border-cream/5">
          {projects.map(({ label, title, description, tags, status }, i) => (
            <div
              key={title}
              className="proj-card group relative px-6 py-8 hover:bg-cream/[0.03] transition-colors duration-300"
            >
              {/* Index */}
              <span className="absolute top-8 right-6 font-sans text-[10px] tracking-[0.2em] uppercase text-cream/20">
                {String(i + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}
              </span>

              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pr-16 sm:pr-20">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2.5 mb-2">
                    <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-gold/70">
                      {label}
                    </span>
                    <span
                      className={`font-sans text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full border ${
                        status === "Completed"
                          ? "border-green-500/20 text-green-400/60"
                          : status === "Ongoing"
                          ? "border-gold/25 text-gold/60"
                          : "border-cream/15 text-cream/40"
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                  <h3 className="font-serif text-[1.45rem] font-light text-cream mb-3 leading-snug">
                    {title}
                  </h3>
                  <p className="font-sans text-[14px] text-cream/55 leading-[1.7] max-w-2xl">
                    {description}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="font-sans text-[10px] tracking-wider uppercase text-cream/35 border border-cream/10 px-2.5 py-1"
                      >
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
