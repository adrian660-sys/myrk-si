"use client";

import { useRouter } from "next/navigation";

export default function Footer() {
  const router = useRouter();

  const links = [
    { label: "About",   href: "/#about",  isPage: false },
    { label: "Work",    href: "/work",     isPage: true  },
    { label: "Contact", href: "/#contact", isPage: false },
  ];

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, isPage: boolean) => {
    e.preventDefault();
    if (isPage) { router.push(href); return; }
    const hash = href.replace("/#", "");
    if (window.location.pathname === "/") {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push(href);
    }
  };

  return (
    <footer className="bg-[#080808] border-t border-cream/5 py-8 px-6 md:px-14">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <a
          href="/"
          onClick={(e) => { e.preventDefault(); router.push("/"); }}
          className="font-serif text-xl font-light tracking-widest text-cream hover:text-cream/80 transition-colors"
        >
          myrk<span className="text-gold">.</span>
        </a>

        <p className="font-sans text-xs text-cream/25 tracking-wider">
          © 2025 Adrian Džeka · Ljubljana, SI
        </p>

        <nav className="flex gap-6">
          {links.map(({ label, href, isPage }) => (
            <a
              key={href}
              href={href}
              onClick={(e) => handleClick(e, href, isPage)}
              className="font-sans text-xs text-cream/35 hover:text-cream/65 tracking-[0.15em] uppercase transition-colors duration-300"
            >
              {label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
