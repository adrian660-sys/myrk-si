"use client";

export default function Footer() {
  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="section-dark border-t border-cream/5 py-8 px-6 md:px-14">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo */}
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          className="font-serif text-xl font-light tracking-widest text-cream"
        >
          myrk<span className="text-gold">.</span>
        </a>

        {/* Copyright */}
        <p className="font-sans text-xs text-cream/30 tracking-wider">
          © 2025 Adrian Džeka · Ljubljana, SI
        </p>

        {/* Links */}
        <nav className="flex gap-6">
          {[
            { label: "About", href: "#about" },
            { label: "Work", href: "#experience" },
            { label: "Contact", href: "#contact" },
          ].map(({ label, href }) => (
            <a
              key={href}
              href={href}
              onClick={(e) => handleNav(e, href)}
              className="font-sans text-xs text-cream/40 hover:text-cream/70 tracking-wider uppercase transition-colors duration-300"
            >
              {label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
