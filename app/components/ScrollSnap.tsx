"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollSnap() {
  useEffect(() => {
    // Mobile: no pin effect — free scroll
    if (window.innerWidth < 768) return;

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-section]")
    );
    if (sections.length === 0) return;

    const triggers: ScrollTrigger[] = [];

    sections.forEach((section) => {
      // Brief pin: section locks at top of viewport for 160px of scroll travel,
      // giving content time to "settle" before the user scrolls on.
      const st = ScrollTrigger.create({
        trigger: section,
        pin: true,
        pinSpacing: true,
        start: "top top+=78", // account for 80px nav
        end: "+=160",
        // No scrub — the pin simply pauses here while the user scrolls 160px
        onEnter: () => {
          // Animate section content in with a slight overshoot for the "gravity" settle feel
          const targets = section.querySelectorAll<HTMLElement>(
            "h1, h2, p, blockquote, .anim, .reveal, form, [data-section-child]"
          );
          if (targets.length === 0) return;
          gsap.fromTo(
            targets,
            { y: 22, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.65,
              stagger: 0.06,
              ease: "back.out(1.4)",
              clearProps: "transform,opacity",
            }
          );
        },
      });
      triggers.push(st);
    });

    const onResize = () => {
      if (window.innerWidth < 768) {
        triggers.forEach((t) => t.kill());
        triggers.length = 0;
      }
    };
    window.addEventListener("resize", onResize);

    return () => {
      triggers.forEach((t) => t.kill());
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return null;
}
