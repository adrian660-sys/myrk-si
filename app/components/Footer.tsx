"use client";

import { useRouter } from "next/navigation";

export default function Footer() {
  const router = useRouter();

  const links = [
    { label: "Home", href: "/" },
    { label: "Work", href: "/work" },
    { label: "Sports", href: "/sports" },
    { label: "Notebook", href: "/notebook" },
  ];

  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault();
    router.push(href);
  };

  return (
    <footer className="bg-[#080808] border-t border-cream/5 py-10 px-6 md:px-14">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            router.push("/");
          }}
          className="font-serif text-xl font-light tracking-widest text-cream hover:text-cream/80 transition-colors"
        >
          myrk<span className="text-gold">.</span>
        </a>

        <p className="font-sans text-xs t-cream-faint tracking-wider">
          © {new Date().getFullYear()} Adrian Džeka · Ljubljana, SI ·{" "}
          <a
            href="mailto:adrian@myrk.si"
            className="hover:text-cream/60 transition-colors"
          >
            adrian@myrk.si
          </a>
        </p>

        <nav className="flex flex-wrap gap-6 justify-center">
          {links.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              onClick={(e) => handleClick(e, href)}
              className="font-sans text-xs t-cream-faint hover:text-cream/65 tracking-[0.15em] uppercase transition-colors duration-300"
            >
              {label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
