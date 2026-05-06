"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type ResearchItem = {
  label: string;
  title: string;
  summary: string;
  highlights: string[];
  note?: string;
};

const research: ResearchItem[] = [
  {
    label: "Strategy · Footwear",
    title: "AI impact on the European sports shoe market",
    summary:
      "How AI is reshaping marketing, supply chain, product design, and retail strategy in European athletic footwear — with a competitor benchmark and a practical roadmap.",
    highlights: [
      "European footwear market: $132.1B (2025e) → $218.4B (2033), ~6.5% CAGR",
      "Athletic footwear segment projected ~12.4% CAGR; “athleisure” + health culture as drivers",
      "Benchmark matrix across Nike / Adidas / Jordan / Puma / New Balance (marketing, forecasting, product AI, omnichannel)",
    ],
  },
  {
    label: "Procurement · Hospitality",
    title: "Boutique hotel soap & shampoo options (portfolio procurement)",
    summary:
      "Supplier landscape and decision framework for standardizing in-room toiletries across a multi-property boutique group — balancing cost, sustainability, and guest perception.",
    highlights: [
      "Core shifts: refill systems, sustainability requirements, supplier consolidation",
      "Tiered approach (standard rooms vs suites) to avoid “overpay everywhere / underdeliver everywhere”",
      "Pilot-first rollout logic: sample evaluation → pilot → scale",
    ],
    note:
      "Published as an excerpt. No client identity, vendor pricing, or deal-specific terms.",
  },
  {
    label: "Payments · Africa",
    title: "Finance and crypto payments in Kenya vs South Africa",
    summary:
      "A comparative market brief on two very different payment ecosystems: Kenya’s mobile-money rails and South Africa’s bank/fintech rails — and where crypto actually fits.",
    highlights: [
      "Kenya: mobile money (M‑Pesa) as the primary rail; deep everyday adoption",
      "South Africa: bank-led digital payments, fintech merchant tooling, and institutional crypto activity",
      "Regulation + inclusion: VASP frameworks, AML/CFT posture, and CBDC exploration",
    ],
  },
  {
    label: "Payments · Global",
    title: "Global cryptocurrency payments research (ecosystem scan)",
    summary:
      "Global map of crypto payments rails, platforms, compliance constraints, and adoption barriers — focusing on what makes merchant acceptance work in practice.",
    highlights: [
      "Key rails/tech: stablecoins for volatility control + Lightning for speed/fees",
      "Regulatory patterning: EU MiCA vs fragmented US oversight vs Asia sandbox models",
      "Operational reality: onboarding/KYC, fraud surface area, and integration complexity",
    ],
    note:
      "Published as an excerpt. No client identity or proprietary platform shortlists.",
  },
  {
    label: "AgTech · Water",
    title: "Worldwide irrigation systems and the application of AI",
    summary:
      "A practical overview of irrigation system trade-offs (cost vs efficiency) and where AI/IoT measurably improves water usage, yield, and operating cost.",
    highlights: [
      "System comparison: surface vs sprinkler vs drip vs subsurface (efficiency + cost ranges)",
      "AI capabilities: sensor integration, predictive scheduling, automated control, crop stress detection",
      "Typical outcomes: water savings ~25–50% and yield lift up to ~15% (context-dependent)",
    ],
  },
  {
    label: "Energy · Investing",
    title: "Solar energy investment analysis: Croatia vs North Macedonia",
    summary:
      "A side-by-side market comparison for utility-scale solar investment — regulatory posture, cost structure ranges, and a due diligence checklist for execution.",
    highlights: [
      "Croatia: EU-aligned stability; permitting/grid constraints as the main execution risk",
      "North Macedonia: faster entry and lower costs; higher policy/grid uncertainty",
      "Decision frame: risk tolerance vs speed-to-deployment, plus next-step diligence workflow",
    ],
    note:
      "Published as an excerpt. Numbers shown are ranges; no deal-specific assumptions.",
  },
];

export default function ResearchSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        sectionRef.current?.querySelectorAll(".reveal") ?? [],
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.06,
          ease: "power2.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="research"
      ref={sectionRef}
      className="section-light py-24 md:py-32 px-6 md:px-14 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 reveal">
          <p className="font-sans text-xs tracking-[0.35em] uppercase text-[#c9a84c] mb-3">
            Projects
          </p>
          <h2 className="font-serif text-[clamp(2rem,4vw,3.5rem)] font-light text-dark leading-tight">
            Selected work.
          </h2>
          <p className="mt-4 font-sans text-[15px] t-ink-muted leading-relaxed max-w-2xl">
            For now, my “projects” are research deliverables: market scans,
            decision frameworks, and operational briefs. My roles and employers
            live under Experience.
          </p>
        </div>

        <div className="flex flex-col divide-y divide-dark/10 border border-dark/10 bg-[#f9f6f0] reveal">
          {research.map((item) => (
            <article
              key={item.title}
              className="px-6 py-8 hover:bg-white transition-colors duration-300"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-[10px] tracking-[0.25em] uppercase text-[#c9a84c]/80 mb-2">
                    {item.label}
                  </p>
                  <h3 className="font-serif text-[1.45rem] font-light text-dark leading-snug">
                    {item.title}
                  </h3>
                  <p className="mt-3 font-sans text-[14px] t-ink-muted leading-[1.75] max-w-3xl">
                    {item.summary}
                  </p>

                  <ul className="mt-5 grid md:grid-cols-3 gap-3">
                    {item.highlights.map((h) => (
                      <li
                        key={h}
                        className="border border-dark/10 bg-[#f9f6f0] px-4 py-3"
                      >
                        <p className="font-sans text-[12px] t-ink-muted leading-relaxed">
                          {h}
                        </p>
                      </li>
                    ))}
                  </ul>

                  {item.note && (
                    <p className="mt-5 font-sans text-[12px] t-ink-faint leading-relaxed">
                      {item.note}
                    </p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

