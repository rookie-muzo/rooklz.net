"use client";

import { useEffect, useRef, useState } from "react";

type Track = {
  name: string;
  artist: string;
  url: string;
  nowPlaying: boolean;
  album?: string;
  date?: string;
};

export default function NowPlayingPanel() {
  const [current, setCurrent] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progressPct, setProgressPct] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const durationRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    const stopRAF = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    const startRAF = () => {
      stopRAF();
      if (!startedAtRef.current || !durationRef.current) return;
      const tick = () => {
        if (!startedAtRef.current || !durationRef.current || !mounted || !isPlaying) return;
        const elapsed = Date.now() - startedAtRef.current;
        const pct = Math.max(0, Math.min(100, (elapsed / durationRef.current) * 100));
        setProgressPct(pct);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    };
    const hydrateFromJson = async () => {
      try {
        const res = await fetch("/api/now-playing?format=json", { cache: "no-store" });
        const data = await res.json();
        if (!mounted) return;
        const np = data.nowPlaying;
        if (np) {
          setCurrent(np.title ? { name: np.title, artist: np.artist, url: np.url || "", nowPlaying: !!np.isPlaying, album: np.album || undefined } : null);
          setIsPlaying(!!np.isPlaying);
          startedAtRef.current = np.startedAtMs || null;
          durationRef.current = np.durationMs || null;
          if (np.isPlaying) { startRAF(); } else { stopRAF(); setProgressPct(null); }
        }
      } catch {}
    };
    hydrateFromJson();
    // Prefer SSE from direct WACUP updates with auto-reconnect
    let pollId: any = null;
    const startPoll = () => { pollId = setInterval(hydrateFromJson, 30000); };
    const connectSSE = () => {
      const sse = new EventSource("/api/now-playing");
      sse.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          if (!("nowPlaying" in payload)) return;
          const np = payload.nowPlaying as any;
          if (np) {
            setCurrent(np.title ? { name: np.title, artist: np.artist, url: np.url || "", nowPlaying: !!np.isPlaying, album: np.album || undefined } : null);
            setIsPlaying(!!np.isPlaying);
            startedAtRef.current = np.startedAtMs || null;
            durationRef.current = np.durationMs || null;
            if (np.isPlaying) { startRAF(); } else { stopRAF(); setProgressPct(null); }
          } else {
            setCurrent(null);
            setIsPlaying(false);
            startedAtRef.current = null;
            durationRef.current = null;
            stopRAF(); setProgressPct(null);
          }
        } catch {}
      };
      sse.onerror = () => {
        try { sse.close(); } catch {}
        setTimeout(connectSSE, 3000);
        if (!pollId) startPoll();
      };
      return sse;
    };
    const sse = connectSSE();
    return () => {
      mounted = false;
      try { sse.close(); } catch {}
      if (pollId) clearInterval(pollId);
      stopRAF();
    };
  }, [isPlaying]);

  return (
    <div className="p-4 text-sm text-white/80">
      {current ? (
        <div>
          <div className="text-white flex items-center gap-2">
            <span>{current.name}</span>
            {!isPlaying && (<span className="text-xs text-white/60">(Paused)</span>)}
          </div>
          <div className="text-white/70">{current.artist}{current.album ? ` — ${current.album}` : ""}</div>
          {current.url && <a className="text-xs text-[#9fd1ff]" href={current.url} target="_blank" rel="noreferrer">Open</a>}
          {progressPct !== null && isPlaying && (
            <div className="mt-3">
              <div className="h-1 w-full rounded bg-white/10 overflow-hidden">
                <div className="h-full bg-[#3ecf8e]" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-white/60">Nothing playing.</div>
      )}
    </div>
  );
}


