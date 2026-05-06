"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(
        sectionRef.current?.querySelectorAll(".anim") ?? [],
        {
          y: 35,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          clearProps: "all",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 88%",
            toggleActions: "play none none none",
          },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="about"
      data-section
      ref={sectionRef}
      className="bg-white py-12 md:py-20 px-6 md:px-14 overflow-hidden"
      style={{ scrollMarginTop: "80px" }}
    >
      <div className="max-w-7xl mx-auto">
        {/*
          Two-column: photo LEFT, all copy RIGHT.
          Mobile: copy first (order-1), photo below (order-2).
          Desktop: photo left (md:order-1), copy right (md:order-2).
        */}
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">

          {/* ── LEFT: editorial monogram ── */}
          <div className="anim order-2 md:order-1">
            <figure className="relative w-full aspect-[4/5] max-w-[420px] overflow-hidden bg-[#0c0c0c]">
              {/* Film grain */}
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-[0.05] mix-blend-overlay pointer-events-none"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.79 0 0 0 0 0.66 0 0 0 0 0.30 0 0 0 1 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
                }}
              />
              {/* Vignette */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#000_120%)]"
              />
              {/* Gold corner brackets */}
              <span aria-hidden="true" className="absolute top-4 left-4 w-6 h-6 border-t border-l border-gold/55" />
              <span aria-hidden="true" className="absolute top-4 right-4 w-6 h-6 border-t border-r border-gold/55" />
              <span aria-hidden="true" className="absolute bottom-4 left-4 w-6 h-6 border-b border-l border-gold/55" />
              <span aria-hidden="true" className="absolute bottom-4 right-4 w-6 h-6 border-b border-r border-gold/55" />

              {/* Monogram */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center">
                <span className="font-serif font-light leading-none tracking-tight text-cream text-[clamp(5rem,13vw,7.5rem)]">
                  A<span className="text-gold mx-1">·</span>D
                </span>
                <span aria-hidden="true" className="block w-12 h-px bg-gold/50" />
                <div className="flex flex-col items-center gap-1.5">
                  <span className="font-sans text-[10px] tracking-[0.4em] uppercase text-cream/60">
                    Adrian Džeka
                  </span>
                  <span className="font-serif italic text-xs text-cream/35">
                    Ljubljana &middot; est. 2017
                  </span>
                </div>
              </div>

              {/* Edition stamp */}
              <figcaption className="absolute bottom-3 right-4 font-sans text-[9px] tracking-[0.3em] uppercase text-gold/50">
                myrk &middot; vol. i
              </figcaption>
            </figure>
          </div>

          {/* ── RIGHT: label + headline + copy + quotes ── */}
          <div className="anim order-1 md:order-2 flex flex-col gap-5">
            <p className="font-sans text-xs tracking-[0.35em] uppercase text-[#c9a84c]">
              About
            </p>
            <h2 className="font-serif text-[clamp(2.4rem,5vw,4.5rem)] font-light leading-[1.05] text-[#1a1a1a]">
              How you do one thing<br />
              <span className="text-[#c9a84c]">is how you do everything.</span>
            </h2>
            <div className="w-10 h-px bg-[#1a1a1a]/15" />
            <p className="font-serif text-base italic font-light text-[#1a1a1a]/45 leading-relaxed">
              &ldquo;I run myrk. because I choose who I work with.&rdquo;
            </p>

            <div className="flex flex-col gap-4 mt-1">
              <p className="font-sans text-[17px] leading-[1.75] text-[#1a1a1a]/70">
                I&apos;m Adrian — project manager, sole proprietor, and sports
                president based in Ljubljana. Before I ask what you want, I
                need to understand who you are. That&apos;s how I work.
              </p>
              <p className="font-sans text-[17px] leading-[1.75] text-[#1a1a1a]/70">
                I built Šiškarji from zero. I managed concert tours from the
                side of the stage. I flew solo to Berlin for an interview just
                to see what I was made of. Everything I know, I learned by
                doing.
              </p>
              <p className="font-sans text-[17px] leading-[1.75] text-[#1a1a1a]/70">
                When a project goes wrong, I don&apos;t look for someone to
                blame — I call the team and we fix it together.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
