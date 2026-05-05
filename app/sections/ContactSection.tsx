"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headlineRef.current,
        { y: 50, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.9, ease: "power3.out",
          scrollTrigger: { trigger: headlineRef.current, start: "top 80%" },
        }
      );
      gsap.fromTo(
        formRef.current?.querySelectorAll(".form-item") ?? [],
        { y: 35, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.65, stagger: 0.09, ease: "power2.out",
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
    "w-full bg-transparent border-b border-cream/20 py-3 font-sans text-sm text-cream placeholder-cream/30 focus:outline-none focus:border-gold/60 transition-colors duration-300";

  return (
    <section
      id="contact"
      data-section
      ref={sectionRef}
      className="section-dark py-24 md:py-32 px-6 md:px-14 overflow-hidden"
      style={{ scrollMarginTop: "80px" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-14 md:gap-24">

          {/* Left */}
          <div ref={headlineRef}>
            <p className="font-sans text-xs tracking-[0.35em] uppercase text-gold mb-4">
              Contact
            </p>
            <h2 className="font-serif text-[clamp(2rem,4.5vw,3.8rem)] font-light text-cream leading-tight mb-6">
              When you call myrk. —<br />it's handled.
            </h2>
            <p className="font-sans text-[15px] text-cream/50 leading-relaxed max-w-sm mb-10">
              Before I ask what you need, I want to understand who you are. If you have a vision and need someone to execute it — let's talk.
            </p>

            <div className="flex flex-col gap-4">
              <a
                href="mailto:adrian@myrk.si"
                className="flex items-center gap-3 text-cream/60 hover:text-cream transition-colors duration-300 group min-h-[44px]"
              >
                <span className="w-9 h-9 shrink-0 rounded-full border border-cream/10 flex items-center justify-center group-hover:border-gold/40 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 3h12v8H1V3zm0 0l6 5 6-5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="font-sans text-sm">adrian@myrk.si</span>
              </a>
              <a
                href="#"
                className="flex items-center gap-3 text-cream/60 hover:text-cream transition-colors duration-300 group min-h-[44px]"
              >
                <span className="w-9 h-9 shrink-0 rounded-full border border-cream/10 flex items-center justify-center group-hover:border-gold/40 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1" />
                    <path d="M4 6v4M4 4.5v.01M6 6v4M6 7a2 2 0 0 1 4 0v3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="font-sans text-sm">LinkedIn (coming soon)</span>
              </a>
              <div className="flex items-center gap-3 text-cream/40 min-h-[44px]">
                <span className="w-9 h-9 shrink-0 rounded-full border border-cream/10 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1C4.79 1 3 2.79 3 5c0 3.5 4 8 4 8s4-4.5 4-8c0-2.21-1.79-4-4-4z" stroke="currentColor" strokeWidth="1" />
                    <circle cx="7" cy="5" r="1.5" stroke="currentColor" strokeWidth="1" />
                  </svg>
                </span>
                <span className="font-sans text-sm">Ljubljana, Slovenia</span>
              </div>
            </div>
          </div>

          {/* Right — form */}
          <div>
            {sent ? (
              <div className="flex flex-col items-center justify-center h-full gap-5 py-16">
                <div className="w-14 h-14 rounded-full border border-gold/40 flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l5 5L19 7" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="font-serif text-2xl font-light text-cream">Message sent.</p>
                <p className="font-sans text-sm text-cream/40">I'll be in touch.</p>
              </div>
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-7">
                <div className="form-item">
                  <label className="font-sans text-[10px] tracking-[0.3em] uppercase text-cream/30 mb-2 block">Name</label>
                  <input
                    type="text" required placeholder="Your name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="form-item">
                  <label className="font-sans text-[10px] tracking-[0.3em] uppercase text-cream/30 mb-2 block">Email</label>
                  <input
                    type="email" required placeholder="your@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="form-item">
                  <label className="font-sans text-[10px] tracking-[0.3em] uppercase text-cream/30 mb-2 block">Message</label>
                  <textarea
                    required rows={4} placeholder="Tell me about your project..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className={`${inputClass} resize-none`}
                  />
                </div>
                <div className="form-item">
                  <button
                    type="submit"
                    className="min-h-[44px] px-8 py-3 rounded-full bg-gold text-[#080808] font-sans font-medium text-sm tracking-[0.15em] uppercase hover:bg-gold-light transition-colors duration-300"
                  >
                    Send message
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
