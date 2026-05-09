"use client";

import { useEffect, useMemo, useState } from "react";

type Folder = {
  key: string;
  label: string;
  path: string;
  unseen: number;
};

type ListItem = {
  id: number;
  from: string;
  subject: string;
  date: string;
  unread: boolean;
  threadKey: string;
};

export default function InboxPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderPath, setFolderPath] = useState<string>("INBOX");
  const [items, setItems] = useState<ListItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [threadOpen, setThreadOpen] = useState(false);
  const [threadMsgs, setThreadMsgs] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replying, setReplying] = useState(false);
  const [mode, setMode] = useState<"read" | "compose">("read");
  const [compose, setCompose] = useState({ to: "", subject: "", body: "" });
  const [sending, setSending] = useState(false);

  const fmt = useMemo(
    () =>
      new Intl.DateTimeFormat("en", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    []
  );

  const activeFolderLabel =
    folders.find((f) => f.path === folderPath)?.label || "Inbox";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("compose") === "1") {
      setMode("compose");
      setReplying(false);
      setSelectedId(null);
      setSelected(null);
      setThreadOpen(false);
      setThreadMsgs([]);
      window.history.replaceState({}, "", "/portal/inbox");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingFolders(true);
        const res = await fetch("/api/mail/folders");
        const data = (await res.json().catch(() => null)) as
          | { ok?: boolean; folders?: Folder[]; error?: string }
          | null;
        if (!res.ok || !data?.ok || !data.folders) {
          throw new Error(data?.error || "Failed to load folders.");
        }
        if (!cancelled) {
          setFolders(data.folders);
          // default to Inbox
          const inbox = data.folders.find((f) => f.key === "INBOX");
          if (inbox) setFolderPath(inbox.path);
        }
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Failed to load folders/messages.";
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoadingFolders(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadList = async (opts?: { keepSelection?: boolean }) => {
    setLoadingList(true);
    setError(null);
    try {
      const url = new URL("/api/mail/inbox", window.location.origin);
      url.searchParams.set("folder", folderPath);
      if (q.trim()) url.searchParams.set("q", q.trim());
      const res = await fetch(url.toString());
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; items?: ListItem[]; error?: string }
        | null;
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Request failed.");
      setItems(data.items || []);
      if (!opts?.keepSelection) {
        setSelectedId(null);
        setSelected(null);
        setThreadOpen(false);
        setThreadMsgs([]);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load messages.";
      setError(msg);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (!loadingFolders) loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderPath, loadingFolders]);

  const openMessage = async (id: number) => {
    setMode("read");
    setSelectedId(id);
    setLoadingMsg(true);
    setReplying(false);
    try {
      const res = await fetch(`/api/mail/${id}`);
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; message?: any; error?: string }
        | null;
      if (!res.ok || !data?.ok || !data.message) throw new Error(data?.error);
      setSelected(data.message);

      // Optimistically flip unread state in list (server already marks seen on open)
      setItems((prev) =>
        prev.map((m) => (m.id === id ? { ...m, unread: false } : m))
      );
      setFolders((prev) =>
        prev.map((f) =>
          f.path === folderPath ? { ...f, unseen: Math.max(0, f.unseen - 1) } : f
        )
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load message.";
      setError(msg);
    } finally {
      setLoadingMsg(false);
    }
  };

  const loadThread = async (threadKey: string) => {
    setThreadOpen(true);
    setThreadMsgs([]);
    try {
      const url = new URL("/api/mail/thread", window.location.origin);
      url.searchParams.set("folder", folderPath);
      url.searchParams.set("threadKey", threadKey);
      const res = await fetch(url.toString());
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; messages?: any[]; error?: string }
        | null;
      if (!res.ok || !data?.ok) throw new Error(data?.error);
      setThreadMsgs(data.messages || []);
    } catch {
      // keep minimal
    }
  };

  const startReply = () => {
    if (!selected) return;
    setReplying(true);
    setMode("compose");
    setCompose({
      to: selected.from?.match(/<([^>]+)>/)?.[1] || selected.from || "",
      subject: selected.subject?.toLowerCase().startsWith("re:")
        ? selected.subject
        : `Re: ${selected.subject || ""}`,
      body: "",
    });
  };

  const startForward = () => {
    if (!selected) return;
    setReplying(false);
    setMode("compose");
    const quoted = [
      "",
      "",
      "---- Forwarded message ----",
      selected.from ? `From: ${selected.from}` : "",
      selected.date ? `Date: ${new Date(selected.date).toUTCString()}` : "",
      selected.subject ? `Subject: ${selected.subject}` : "",
      "",
      selected.text || "",
    ]
      .filter(Boolean)
      .join("\n");
    setCompose({
      to: "",
      subject: selected.subject?.toLowerCase().startsWith("fwd:")
        ? selected.subject
        : `Fwd: ${selected.subject || ""}`,
      body: quoted,
    });
  };

  const sendCompose = async () => {
    if (sending) return;
    setSending(true);
    try {
      const payload = replying
        ? { replyToId: selectedId, message: compose.body }
        : selectedId && compose.subject.toLowerCase().startsWith("fwd:")
        ? { forwardOfId: selectedId, to: compose.to, message: compose.body }
        : { to: compose.to, subject: compose.subject, message: compose.body };

      const res = await fetch("/api/mail/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;
      if (!res.ok || !data?.ok) throw new Error(data?.error);
      setMode("read");
      setCompose({ to: "", subject: "", body: "" });
    } catch {
      alert("Failed to send.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border border-cream/10 bg-cream/[0.02]">
      <div className="grid grid-cols-12 min-h-[72vh]">
        {/* Sidebar */}
        <aside className="col-span-12 md:col-span-3 border-b md:border-b-0 md:border-r border-cream/10">
          <div className="px-5 py-5 border-b border-cream/10">
            <button
              type="button"
              onClick={() => {
                setMode("compose");
                setReplying(false);
                setSelectedId(null);
                setSelected(null);
                setCompose({ to: "", subject: "", body: "" });
              }}
              className="w-full min-h-[44px] px-6 py-2.5 rounded-full text-[#080808] font-sans font-medium text-xs tracking-[0.15em] uppercase transition-all duration-300 hover:shadow-[0_0_30px_rgba(201,168,76,0.35)]"
              style={{
                background:
                  "linear-gradient(135deg, #c9a84c 0%, #e0c170 50%, #c9a84c 100%)",
              }}
            >
              Compose
            </button>
          </div>

          <div className="p-3">
            {loadingFolders ? (
              <div className="px-2 py-4 font-sans text-sm t-cream-muted">
                Loading…
              </div>
            ) : (
              <ul className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
                {folders.map((f) => {
                  const active = f.path === folderPath;
                  return (
                    <li key={f.key} className="shrink-0 md:shrink">
                      <button
                        type="button"
                        onClick={() => setFolderPath(f.path)}
                        className={`w-full text-left px-4 py-2.5 border border-transparent transition-colors ${
                          active
                            ? "bg-cream/[0.04] border-cream/10 text-cream"
                            : "text-cream/70 hover:bg-cream/[0.03] hover:text-cream"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-sans text-[12px] tracking-[0.2em] uppercase">
                            {f.label}
                          </span>
                          {f.unseen > 0 && (
                            <span className="min-w-[28px] text-center font-sans text-[11px] text-gold border border-gold/30 px-2 py-0.5 rounded-full">
                              {f.unseen}
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* List */}
        <section className="col-span-12 md:col-span-4 border-b md:border-b-0 md:border-r border-cream/10">
          <div className="px-5 py-5 border-b border-cream/10">
            <p className="font-sans text-xs tracking-[0.35em] uppercase text-gold mb-2">
              {activeFolderLabel}
            </p>
            <div className="flex items-center gap-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                className="flex-1 bg-transparent border-b border-cream/20 py-2 font-sans text-[14px] text-cream placeholder-cream/30 focus:outline-none focus:border-gold/60 transition-colors"
              />
              <button
                type="button"
                onClick={() => loadList({ keepSelection: false })}
                className="min-h-[38px] px-4 py-2 rounded-full border border-cream/20 text-cream/70 hover:text-cream hover:border-cream/45 transition-colors font-sans text-[11px] tracking-[0.2em] uppercase"
              >
                Search
              </button>
            </div>
          </div>

          {loadingList ? (
            <div className="px-5 py-8 font-sans text-sm t-cream-muted">Loading…</div>
          ) : error ? (
            <div className="px-5 py-8 font-sans text-sm t-cream-muted">{error}</div>
          ) : items.length === 0 ? (
            <div className="px-5 py-8 font-sans text-sm t-cream-muted">No messages.</div>
          ) : (
            <ul className="divide-y divide-cream/10">
              {items.map((m) => {
                const active = m.id === selectedId;
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => openMessage(m.id)}
                      className={`w-full text-left px-5 py-4 transition-colors ${
                        active ? "bg-cream/[0.04]" : "hover:bg-cream/[0.03]"
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="font-sans text-[12px] t-cream-muted truncate">
                          {m.from || "(unknown sender)"}
                        </p>
                        <p className="font-sans text-[11px] t-cream-faint shrink-0">
                          {fmt.format(new Date(m.date))}
                        </p>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <p
                          className={`font-serif text-[16px] truncate ${
                            m.unread ? "text-cream font-normal" : "text-cream/80 font-light"
                          }`}
                        >
                          {m.subject}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            loadThread(m.threadKey);
                            setSelectedId(m.id);
                          }}
                          className="shrink-0 font-sans text-[10px] tracking-[0.25em] uppercase text-gold/80 hover:text-gold"
                        >
                          Thread
                        </button>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Content */}
        <section className="col-span-12 md:col-span-5">
          <div className="px-6 py-5 border-b border-cream/10">
            <p className="font-sans text-xs tracking-[0.35em] uppercase text-gold mb-2">
              {mode === "compose" ? "Compose" : "Message"}
            </p>
            <h2 className="font-serif text-2xl font-light text-cream truncate">
              {mode === "compose"
                ? compose.subject || "New email"
                : selected?.subject || "Select a message"}
            </h2>
          </div>

          <div className="px-6 py-6">
            {mode === "compose" ? (
              <div className="flex flex-col gap-5">
                {!replying && (
                  <>
                    <div>
                      <label className="font-sans text-[10px] tracking-[0.3em] uppercase t-cream-faint mb-2 block">
                        To
                      </label>
                      <input
                        value={compose.to}
                        onChange={(e) => setCompose((p) => ({ ...p, to: e.target.value }))}
                        placeholder="name@example.com"
                        className="w-full bg-transparent border-b border-cream/20 py-2 font-sans text-[14px] text-cream placeholder-cream/30 focus:outline-none focus:border-gold/60 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="font-sans text-[10px] tracking-[0.3em] uppercase t-cream-faint mb-2 block">
                        Subject
                      </label>
                      <input
                        value={compose.subject}
                        onChange={(e) => setCompose((p) => ({ ...p, subject: e.target.value }))}
                        placeholder="Subject"
                        className="w-full bg-transparent border-b border-cream/20 py-2 font-sans text-[14px] text-cream placeholder-cream/30 focus:outline-none focus:border-gold/60 transition-colors"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="font-sans text-[10px] tracking-[0.3em] uppercase t-cream-faint mb-2 block">
                    Body
                  </label>
                  <textarea
                    value={compose.body}
                    onChange={(e) => setCompose((p) => ({ ...p, body: e.target.value }))}
                    rows={10}
                    className="w-full bg-transparent border border-cream/15 px-4 py-3 font-sans text-[14px] t-cream-body placeholder-cream/30 focus:outline-none focus:border-gold/60 transition-colors"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={sendCompose}
                    disabled={sending}
                    className="min-h-[44px] px-7 py-2.5 rounded-full text-[#080808] font-sans font-medium text-xs tracking-[0.15em] uppercase transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      background:
                        "linear-gradient(135deg, #c9a84c 0%, #e0c170 50%, #c9a84c 100%)",
                    }}
                  >
                    {sending ? "Sending…" : "Send"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("read");
                      setReplying(false);
                    }}
                    className="min-h-[44px] px-7 py-2.5 rounded-full border border-cream/20 text-cream/70 hover:text-cream hover:border-cream/45 transition-colors font-sans text-xs tracking-[0.15em] uppercase"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : loadingMsg ? (
              <p className="font-sans text-sm t-cream-muted">Loading…</p>
            ) : !selected ? (
              <p className="font-sans text-sm t-cream-muted">
                Select a message on the left.
              </p>
            ) : (
              <>
                <div className="grid gap-3">
                  <div className="border border-cream/10 px-4 py-3">
                    <p className="font-sans text-[10px] tracking-[0.25em] uppercase t-cream-faint mb-1">
                      From
                    </p>
                    <p className="font-sans text-[12px] t-cream-body break-words">
                      {selected.from}
                    </p>
                  </div>
                </div>

                {threadOpen && threadMsgs.length > 0 && (
                  <div className="mt-6 border border-cream/10">
                    <div className="px-4 py-3 border-b border-cream/10 flex items-center justify-between">
                      <p className="font-sans text-[10px] tracking-[0.25em] uppercase t-cream-faint">
                        Thread
                      </p>
                      <button
                        type="button"
                        onClick={() => setThreadOpen(false)}
                        className="font-sans text-[10px] tracking-[0.25em] uppercase text-cream/60 hover:text-cream"
                      >
                        Close
                      </button>
                    </div>
                    <ul className="divide-y divide-cream/10">
                      {threadMsgs.map((t) => (
                        <li key={t.id}>
                          <button
                            type="button"
                            onClick={() => openMessage(t.id)}
                            className="w-full text-left px-4 py-3 hover:bg-cream/[0.03] transition-colors"
                          >
                            <div className="flex items-baseline justify-between gap-3">
                              <p className="font-sans text-[12px] t-cream-muted truncate">
                                {t.from}
                              </p>
                              <p className="font-sans text-[11px] t-cream-faint shrink-0">
                                {fmt.format(new Date(t.date))}
                              </p>
                            </div>
                            <p className="font-serif text-[14px] text-cream/85 truncate">
                              {t.subject}
                            </p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={startReply}
                    className="min-h-[40px] px-5 py-2 rounded-full border border-cream/20 text-cream/75 hover:text-cream hover:border-cream/45 transition-colors font-sans text-xs tracking-[0.2em] uppercase"
                  >
                    Reply
                  </button>
                  <button
                    type="button"
                    onClick={startForward}
                    className="min-h-[40px] px-5 py-2 rounded-full border border-cream/20 text-cream/60 hover:text-cream hover:border-cream/45 transition-colors font-sans text-xs tracking-[0.2em] uppercase"
                  >
                    Forward
                  </button>
                </div>

                <pre className="mt-6 whitespace-pre-wrap font-sans text-[14px] leading-[1.75] t-cream-body">
                  {selected.text || "(no text body)"}
                </pre>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

