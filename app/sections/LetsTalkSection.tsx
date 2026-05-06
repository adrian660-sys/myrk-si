"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Universal "Let's talk." CTA — used at the bottom of every page.
 * Replaces the standalone /contact page.
 */
export default function LetsTalkSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headlineRef.current?.querySelectorAll(".reveal") ?? [],
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: headlineRef.current, start: "top 80%" },
        }
      );
      gsap.fromTo(
        formRef.current?.querySelectorAll(".form-item") ?? [],
        { y: 35, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.65,
          stagger: 0.09,
          ease: "power2.out",
          scrollTrigger: { trigger: formRef.current, start: "top 80%" },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  const inputClass =
    "w-full bg-transparent border-b border-cream/20 py-3 font-sans text-[15px] text-cream placeholder-cream/30 focus:outline-none focus:border-gold/60 transition-colors duration-300";

  return (
    <section
      id="contact"
      data-section
      ref={sectionRef}
      className="section-dark relative py-28 md:py-40 px-6 md:px-14 overflow-hidden"
      style={{ scrollMarginTop: "80px" }}
    >
      {/* Big editorial watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -bottom-10 text-center font-serif font-bold leading-[0.85] tracking-tight text-cream/[0.025] select-none"
        style={{ fontSize: "clamp(7rem, 22vw, 22rem)" }}
      >
        TALK
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div ref={headlineRef} className="mb-14 max-w-3xl">
          <p className="reveal font-sans text-xs tracking-[0.35em] uppercase text-gold mb-4">
            Let&apos;s talk
          </p>
          <h2 className="reveal font-serif text-[clamp(2.5rem,6vw,5.5rem)] font-light text-cream leading-[1.05] mb-6">
            When you call myrk. —
            <br />
            it&apos;s handled.
          </h2>
          <p className="reveal font-sans text-[16px] t-cream-muted leading-relaxed max-w-xl">
            Before I ask what you need, I want to understand who you are. If you
            have a vision and need someone to execute it — let&apos;s talk.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-14 md:gap-24 items-start">
          {/* Left — channels */}
          <div className="flex flex-col gap-4">
            <a
              href="mailto:adrian@myrk.si"
              className="flex items-center gap-3 t-cream-body hover:text-cream transition-colors duration-300 group min-h-[44px]"
            >
              <span className="w-9 h-9 shrink-0 rounded-full border border-cream/15 flex items-center justify-center group-hover:border-gold/50 transition-colors">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M1 3h12v8H1V3zm0 0l6 5 6-5"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className="font-sans text-[15px]">adrian@myrk.si</span>
            </a>

            <div className="flex items-center gap-3 t-cream-body min-h-[44px]">
              <span className="w-9 h-9 shrink-0 rounded-full border border-cream/15 flex items-center justify-center">
                <span className="relative flex w-2 h-2">
                  <span
                    aria-hidden="true"
                    className="absolute inline-flex h-full w-full rounded-full bg-gold/60 opacity-75 animate-pulse-ring"
                  />
                  <span className="relative inline-flex w-2 h-2 rounded-full bg-gold" />
                </span>
              </span>
              <span className="font-sans text-[15px]">
                Currently accepting select projects
              </span>
            </div>

            <div className="flex items-center gap-3 t-cream-muted min-h-[44px]">
              <span className="w-9 h-9 shrink-0 rounded-full border border-cream/15 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M7 1C4.79 1 3 2.79 3 5c0 3.5 4 8 4 8s4-4.5 4-8c0-2.21-1.79-4-4-4z"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                  <circle
                    cx="7"
                    cy="5"
                    r="1.5"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                </svg>
              </span>
              <span className="font-sans text-[15px]">
                Ljubljana, Slovenia · CET
              </span>
            </div>

            <div className="mt-8 pt-8 border-t border-cream/10 flex flex-col gap-1.5">
              <p className="font-sans text-[10px] tracking-[0.3em] uppercase t-cream-faint">
                Response time
              </p>
              <p className="font-serif text-2xl font-light t-cream-body">
                Within 24 hours.
              </p>
            </div>
          </div>

          {/* Right — form */}
          <div>
            {sent ? (
              <div className="flex flex-col items-center justify-center h-full gap-5 py-16">
                <div className="w-14 h-14 rounded-full border border-gold/40 flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 12l5 5L19 7"
                      stroke="#c9a84c"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="font-serif text-2xl font-light text-cream">
                  Message sent.
                </p>
                <p className="font-sans text-sm t-cream-faint">
                  I&apos;ll be in touch.
                </p>
              </div>
            ) : (
              <form
                ref={formRef}
                onSubmit={handleSubmit}
                className="flex flex-col gap-7"
              >
                <div className="form-item">
                  <label className="font-sans text-[10px] tracking-[0.3em] uppercase t-cream-faint mb-2 block">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
                <div className="form-item">
                  <label className="font-sans text-[10px] tracking-[0.3em] uppercase t-cream-faint mb-2 block">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
                <div className="form-item">
                  <label className="font-sans text-[10px] tracking-[0.3em] uppercase t-cream-faint mb-2 block">
                    Message
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell me about your project..."
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                    className={`${inputClass} resize-none`}
                  />
                </div>
                <div className="form-item">
                  <button
                    type="submit"
                    className="group inline-flex items-center gap-3 self-start min-h-[48px] px-8 py-3 rounded-full text-[#080808] font-sans font-medium text-sm tracking-[0.15em] uppercase transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(201,168,76,0.35)]"
                    style={{
                      background:
                        "linear-gradient(135deg, #c9a84c 0%, #e0c170 50%, #c9a84c 100%)",
                    }}
                  >
                    <span>Send message</span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    >
                      <path
                        d="M2 7h10M8 3l4 4-4 4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
