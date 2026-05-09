"use client";

import { useMemo, useState } from "react";

export default function PortalLoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = useMemo(() => {
    if (typeof window === "undefined") return "/portal/inbox";
    const u = new URL(window.location.href);
    const raw = u.searchParams.get("next");
    const fallback = "/portal/inbox";
    if (!raw || raw === "/portal" || raw === "/portal/") return fallback;
    if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
    if (!raw.startsWith("/portal/")) return fallback;
    if (raw.startsWith("/portal/login")) return fallback;
    return raw;
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!res.ok || !data?.ok) {
        setError(data?.error || "Login failed.");
        setLoading(false);
        return;
      }

      window.location.href = next;
    } catch {
      setError("Network error.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-cream flex items-center justify-center px-6">
      <div className="w-full max-w-md border border-cream/10 bg-cream/[0.02] p-8">
        <p className="font-sans text-xs tracking-[0.35em] uppercase text-gold mb-4">
          Portal
        </p>
        <h1 className="font-serif text-4xl font-light leading-tight mb-4">
          Login
        </h1>
        <p className="font-sans text-[14px] t-cream-muted leading-relaxed mb-8">
          Private inbox access. Password-only. No accounts.
        </p>

        {error && (
          <div className="mb-6 border border-gold/25 bg-gold/10 px-5 py-4">
            <p className="font-sans text-[12px] t-cream-body">{error}</p>
          </div>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <div>
            <label className="font-sans text-[10px] tracking-[0.3em] uppercase t-cream-faint mb-2 block">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-transparent border-b border-cream/20 py-3 font-sans text-[15px] text-cream placeholder-cream/30 focus:outline-none focus:border-gold/60 transition-colors duration-300"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group inline-flex items-center justify-center gap-3 min-h-[48px] px-8 py-3 rounded-full text-[#080808] font-sans font-medium text-sm tracking-[0.15em] uppercase transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(201,168,76,0.35)] disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed"
            style={{
              background:
                "linear-gradient(135deg, #c9a84c 0%, #e0c170 50%, #c9a84c 100%)",
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

