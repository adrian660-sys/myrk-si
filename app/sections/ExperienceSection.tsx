"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Job = {
  company: string;
  role: string;
  period: string;
  type: "Project Management" | "Sports" | "Other";
  badge?: string;
};

const jobs: Job[] = [
  {
    company: "Corner Invest",
    role: "Project Manager",
    period: "Jan 2025 – Present",
    type: "Project Management",
    badge: "Freelance",
  },
  {
    company: "Avant Car D.O.O.",
    role: "Call Center Agent",
    period: "Jan 2024 – Present",
    type: "Other",
  },
  {
    company: "IMŠ Clinic",
    role: "Administrative Specialist",
    period: "Sep 2024 – Dec 2024",
    type: "Project Management",
    badge: "Freelance",
  },
  {
    company: "Nina Pušlar",
    role: "Tour & Production Manager",
    period: "Nov 2022 – Present",
    type: "Project Management",
    badge: "Freelance",
  },
  {
    company: "NYD",
    role: "Project Manager",
    period: "Jul 2021 – Aug 2022",
    type: "Project Management",
    badge: "Freelance",
  },
  {
    company: "Lajbah Pub",
    role: "Operations",
    period: "Mar 2023 – Oct 2023",
    type: "Other",
    badge: "Freelance",
  },
  {
    company: "Pakt Media",
    role: "H&S Supervisor",
    period: "Aug 2022 – Oct 2022",
    type: "Project Management",
    badge: "Freelance",
  },
  {
    company: "Nomago",
    role: "Trip Guide",
    period: "Jun 2022 – Aug 2022",
    type: "Other",
    badge: "Freelance",
  },
  {
    company: "CDL Group",
    role: "Beverage & Sales",
    period: "Mar 2020 – Jun 2021",
    type: "Other",
  },
  {
    company: "Šiškarji Sports Association",
    role: "Co-founder & President",
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
      { x: 40, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 0.5,
        stagger: 0.06,
        ease: "power2.out",
      }
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
        <div ref={headlineRef} className="mb-14">
          <p className="font-sans text-xs tracking-[0.35em] uppercase text-gold mb-3">
            Experience
          </p>
          <h2 className="font-serif text-[clamp(2.5rem,5vw,4.5rem)] font-light text-cream leading-tight">
            Every hat.<br />Same standard.
          </h2>
        </div>

        <div className="flex flex-col md:flex-row gap-10 md:gap-16">
          {/* Sidebar filters */}
          <aside className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 md:min-w-[160px]">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActive(f)}
                className={`whitespace-nowrap font-sans text-xs tracking-[0.2em] uppercase px-4 py-2.5 rounded-sm border transition-all duration-300 ${
                  active === f
                    ? "border-gold text-gold bg-gold/5"
                    : "border-cream/10 text-cream/40 hover:border-cream/30 hover:text-cream/60"
                }`}
              >
                {f}
              </button>
            ))}
          </aside>

          {/* Timeline */}
          <div ref={listRef} className="flex-1 flex flex-col gap-[1px] border border-cream/5">
            {filtered.map((job) => (
              <div
                key={`${job.company}-${job.role}`}
                className="job-card group flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6 px-6 py-5 bg-cream/[0.02] hover:bg-cream/[0.05] border-b border-cream/5 last:border-0 transition-colors duration-300"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-sans font-medium text-[15px] text-cream">
                      {job.company}
                    </h3>
                    {job.badge && (
                      <span className="font-sans text-[10px] tracking-widest uppercase text-gold/60 border border-gold/20 px-2 py-0.5 rounded-full">
                        {job.badge}
                      </span>
                    )}
                  </div>
                  <p className="font-sans text-sm text-cream/50">{job.role}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-sans text-[12px] text-cream/30 tracking-wider">
                    {job.period}
                  </p>
                  <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-gold/30 mt-0.5">
                    {job.type}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
