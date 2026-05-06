"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap } from "gsap";

const navLinks = [
  { label: "About",   href: "/#about",   isPage: false },
  { label: "Sports",  href: "/#sports",  isPage: false },
  { label: "Contact", href: "/#contact", isPage: false },
  { label: "Work",    href: "/work",     isPage: true  },
  { label: "Notebook", href: "/notebook", isPage: true  },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen]   = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const [active, setActive]       = useState("");
  const menuRef    = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const pathname   = usePathname();
  const router     = useRouter();

  /* scroll background */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  /* active section via IntersectionObserver — only on homepage */
  useEffect(() => {
    if (pathname !== "/") return;
    const ids = ["hero", "about", "sports", "contact"];
    const obs = ids.map((id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const o = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id); },
        { threshold: 0.4 }
      );
      o.observe(el);
      return o;
    });
    return () => obs.forEach((o) => o?.disconnect());
  }, [pathname]);

  /* mobile overlay animation */
  useEffect(() => {
    const overlay = overlayRef.current;
    const menu    = menuRef.current;
    if (!overlay || !menu) return;
    if (menuOpen) {
      gsap.set(overlay, { display: "flex" });
      gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out" });
      gsap.fromTo(
        menu.querySelectorAll("a, button"),
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, stagger: 0.06, ease: "power3.out", delay: 0.1 }
      );
    } else {
      gsap.to(overlay, {
        opacity: 0, duration: 0.2, ease: "power2.in",
        onComplete: () => gsap.set(overlay, { display: "none" }),
      });
    }
  }, [menuOpen]);

  const navigate = (e: React.MouseEvent, href: string, isPage: boolean) => {
    e.preventDefault();
    setMenuOpen(false);
    if (isPage) {
      router.push(href);
      return;
    }
    const hash = href.replace("/#", "");
    if (pathname === "/") {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push(href);
    }
  };

  const isLinkActive = (href: string, isPage: boolean) => {
    if (isPage) return pathname === href;
    const hash = href.replace("/#", "");
    return pathname === "/" && active === hash;
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-5 flex items-center justify-between transition-all duration-500 ${
          scrolled ? "bg-[#080808]/90 backdrop-blur-md" : "bg-transparent"
        }`}
      >
        {/* Logo */}
        <a
          href="/"
          onClick={(e) => { e.preventDefault(); router.push("/"); }}
          className="font-serif text-2xl font-light tracking-widest text-cream hover:text-cream/80 transition-colors"
        >
          myrk<span className="text-gold">.</span>
        </a>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map(({ label, href, isPage }) => (
            <li key={href}>
              <a
                href={href}
                onClick={(e) => navigate(e, href, isPage)}
                className={`font-sans text-xs tracking-[0.2em] uppercase transition-colors duration-300 ${
                  isLinkActive(href, isPage)
                    ? "text-gold"
                    : "text-cream/60 hover:text-cream"
                }`}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        {/* Hamburger — 44px tap target */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden flex flex-col justify-center items-end gap-[5px] w-11 h-11 z-[60] relative"
          aria-label="Toggle menu"
        >
          <span className={`block h-px bg-cream transition-all duration-300 ${menuOpen ? "w-6 rotate-45 translate-y-[6px]" : "w-6"}`} />
          <span className={`block h-px bg-cream transition-all duration-300 ${menuOpen ? "opacity-0 w-6" : "w-4"}`} />
          <span className={`block h-px bg-cream transition-all duration-300 ${menuOpen ? "w-6 -rotate-45 -translate-y-[6px]" : "w-6"}`} />
        </button>
      </nav>

      {/* Mobile full-screen overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[55] bg-[#080808] flex-col items-center justify-center hidden"
      >
        <div ref={menuRef} className="flex flex-col items-center gap-7">
          {navLinks.map(({ label, href, isPage }) => (
            <a
              key={href}
              href={href}
              onClick={(e) => navigate(e, href, isPage)}
              className="font-serif text-[2.8rem] font-light text-cream hover:text-gold transition-colors duration-300"
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
