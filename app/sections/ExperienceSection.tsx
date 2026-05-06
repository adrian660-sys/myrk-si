"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Job = {
  company: string;
  role: string;
  description: string;
  period: string;
  type: "Project Management" | "Sports" | "Other";
  badge?: string;
};

const jobs: Job[] = [
  {
    company: "Corner Invest",
    role: "Project Manager",
    description: "Leading end-to-end project delivery. Coordinating stakeholders, managing timelines, and ensuring projects close on budget.",
    period: "Jan 2025 – Present",
    type: "Project Management",
    badge: "Freelance",
  },
  {
    company: "Avant Car D.O.O.",
    role: "Call Center Agent",
    description: "Handling customer inquiries and support operations for one of Slovenia's leading vehicle rental companies.",
    period: "Jan 2024 – Present",
    type: "Other",
  },
  {
    company: "IMŠ Clinic",
    role: "Administrative Specialist",
    description: "Streamlined administrative workflows and patient scheduling processes for a private medical clinic.",
    period: "Sep 2024 – Dec 2024",
    type: "Project Management",
    badge: "Freelance",
  },
  {
    company: "Nina Pušlar",
    role: "Tour & Production Manager",
    description: "Managing full concert tour logistics for one of Slovenia's top pop artists — from venue coordination and technical riders to crew management and day-of execution.",
    period: "Nov 2022 – Present",
    type: "Project Management",
    badge: "Freelance",
  },
  {
    company: "NYD",
    role: "Project Manager",
    description: "Overseeing creative and production projects, managing cross-functional teams and client relationships from brief to delivery.",
    period: "Jul 2021 – Aug 2022",
    type: "Project Management",
    badge: "Freelance",
  },
  {
    company: "Lajbah Pub",
    role: "Operations",
    description: "Day-to-day operations management including staffing, inventory, and event coordination.",
    period: "Mar 2023 – Oct 2023",
    type: "Other",
    badge: "Freelance",
  },
  {
    company: "Pakt Media",
    role: "H&S Supervisor",
    description: "On-site health and safety supervision for large-scale media productions and live events.",
    period: "Aug 2022 – Oct 2022",
    type: "Project Management",
    badge: "Freelance",
  },
  {
    company: "Nomago",
    role: "Trip Guide",
    description: "Guided group travel experiences across Europe, managing logistics and guest experience end-to-end.",
    period: "Jun 2022 – Aug 2022",
    type: "Other",
    badge: "Freelance",
  },
  {
    company: "CDL Group",
    role: "Beverage & Sales",
    description: "Sales and beverage operations at large events and venues across Slovenia.",
    period: "Mar 2020 – Jun 2021",
    type: "Other",
  },
  {
    company: "Šiškarji Sports Association",
    role: "Co-founder & President",
    description: "Co-founded and led Šiškarji from a small group of friends to a multi-sport association running floorball, football, basketball, and volleyball. Responsible for strategy, funding, team management, and culture.",
    period: "2017 – Present",
    type: "Sports",
    badge: "Volunteer",
  },
];

type Filter = "All" | "Project Management" | "Sports" | "Other";
const filters: Filter[] = ["All", "Project Management", "Sports", "Other"];

export default function ExperienceSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Filter>("All");

  const filtered = active === "All" ? jobs : jobs.filter((j) => j.type === active);

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
          scrollTrigger: {
            trigger: headlineRef.current,
            start: "top 80%",
          },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!listRef.current) return;
    const cards = listRef.current.querySelectorAll(".job-card");
    gsap.fromTo(
      cards,
      { x: 30, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.45, stagger: 0.06, ease: "power2.out" }
    );
  }, [active]);

  return (
    <section
      id="experience"
      ref={sectionRef}
      className="section-dark py-24 md:py-36 px-6 md:px-14 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div ref={headlineRef} className="mb-10">
          <p className="font-sans text-xs tracking-[0.35em] uppercase text-gold mb-3">
            Experience
          </p>
          <h2 className="font-serif text-[clamp(2rem,4vw,3.5rem)] font-light text-cream leading-tight">
            The full record.
          </h2>
          <p className="font-sans text-[15px] text-cream/50 leading-relaxed max-w-xl mt-4">
            Ten roles. Five categories. One standard. Filter to see the cuts that
            matter to you.
          </p>
        </div>

        {/* Filter tabs — #3 fix: always visible, horizontal wrap */}
        <div className="flex flex-wrap gap-2 mb-10">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={`font-sans text-xs tracking-[0.2em] uppercase px-5 py-2.5 border transition-all duration-300 ${
                active === f
                  ? "border-gold text-gold bg-gold/10"
                  : "border-cream/20 text-cream/50 hover:border-cream/40 hover:text-cream/80"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Job list */}
        <div ref={listRef} className="flex flex-col divide-y divide-cream/5 border border-cream/5">
          {filtered.map((job) => (
            <div
              key={`${job.company}-${job.role}`}
              className="job-card group px-6 py-6 bg-cream/[0.02] hover:bg-cream/[0.05] transition-colors duration-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-6">
                {/* Left: company + role + description */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5 mb-1">
                    <h3 className="font-sans font-medium text-[15px] text-cream">
                      {job.company}
                    </h3>
                    {job.badge && (
                      <span className="font-sans text-[10px] tracking-widest uppercase text-gold/70 border border-gold/25 px-2 py-0.5 rounded-full">
                        {job.badge}
                      </span>
                    )}
                  </div>
                  <p className="font-sans text-sm text-gold/60 mb-2">{job.role}</p>
                  <p className="font-sans text-[13px] leading-relaxed text-cream/40">
                    {job.description}
                  </p>
                </div>

                {/* Right: period + type */}
                <div className="shrink-0 sm:text-right">
                  <p className="font-sans text-[12px] text-cream/30 tracking-wider whitespace-nowrap">
                    {job.period}
                  </p>
                  <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-gold/25 mt-1">
                    {job.type}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
