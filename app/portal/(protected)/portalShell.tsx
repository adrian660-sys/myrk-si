"use client";

export default function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#080808] text-cream">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between">
          <a
            href="/portal/inbox"
            className="font-serif text-2xl font-light tracking-widest text-cream"
          >
            myrk<span className="text-gold">.</span>
            <span className="ml-3 font-sans text-[10px] tracking-[0.35em] uppercase t-cream-faint">
              portal
            </span>
          </a>
          <nav className="flex items-center gap-4">
            <a
              href="/portal/compose"
              className="min-h-[40px] px-5 py-2 rounded-full border border-cream/20 text-cream/80 hover:text-cream hover:border-cream/45 transition-colors font-sans text-xs tracking-[0.2em] uppercase"
            >
              Compose
            </a>
            <button
              type="button"
              onClick={() => {
                fetch("/api/auth", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ action: "logout" }),
                }).finally(() => (window.location.href = "/portal/login"));
              }}
              className="min-h-[40px] px-5 py-2 rounded-full border border-cream/20 text-cream/60 hover:text-cream hover:border-cream/45 transition-colors font-sans text-xs tracking-[0.2em] uppercase"
            >
              Logout
            </button>
          </nav>
        </div>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}

