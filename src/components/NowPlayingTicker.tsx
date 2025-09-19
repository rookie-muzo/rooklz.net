"use client";

import { useEffect, useRef, useState } from "react";

type Track = {
  name: string;
  artist: string;
  url: string;
  nowPlaying: boolean;
  album?: string;
};

export default function NowPlayingTicker() {
  const [current, setCurrent] = useState<Track | null>(null);
  const [progressPct, setProgressPct] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const durationRef = useRef<number | null>(null);

  useEffect(() => {
    let aborted = false;
    const hydrateFromJson = async () => {
      try {
        const res = await fetch("/api/now-playing?format=json", { cache: "no-store" });
        const data: { nowPlaying?: { title?: string; artist?: string; url?: string; album?: string; isPlaying?: boolean; startedAtMs?: number; durationMs?: number } } = await res.json();
        const np = data.nowPlaying;
        if (aborted) return;
        if (np) {
          setCurrent({ name: np.title, artist: np.artist, url: np.url || "", nowPlaying: !!np.isPlaying, album: np.album || undefined } as any);
          startedAtRef.current = np.startedAtMs || null;
          durationRef.current = np.durationMs || null;
          if (startedAtRef.current && durationRef.current && np.isPlaying) {
            const updateProgress = () => {
              if (!startedAtRef.current || !durationRef.current) return;
              const elapsed = Date.now() - startedAtRef.current;
              const pct = Math.max(0, Math.min(100, (elapsed / durationRef.current) * 100));
              setProgressPct(pct);
              rafRef.current = window.requestAnimationFrame(updateProgress);
            };
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = window.requestAnimationFrame(updateProgress);
          } else {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            setProgressPct(null);
          }
        }
      } catch {}
    };
    hydrateFromJson();
    // Prefer SSE stream with auto-reconnect; fallback also polls
    const connectSSE = () => {
      const sse = new EventSource("/api/now-playing", { withCredentials: false });
      sse.onmessage = (ev) => {
        try {
          const payload: { nowPlaying?: { title?: string; artist?: string; url?: string; album?: string; isPlaying?: boolean; startedAtMs?: number; durationMs?: number } } = JSON.parse(ev.data);
          if (!("nowPlaying" in payload)) return; // ignore heartbeats
          const np = payload.nowPlaying;
          if (np) {
            setCurrent({ name: np.title, artist: np.artist, url: np.url || "", nowPlaying: !!np.isPlaying, album: np.album || undefined } as any);
            startedAtRef.current = np.startedAtMs || null;
            durationRef.current = np.durationMs || null;
          } else {
            setCurrent(null);
            startedAtRef.current = null;
            durationRef.current = null;
            setProgressPct(null);
          }
        } catch {}
      };
      sse.onerror = () => {
        try { sse.close(); } catch {}
        setTimeout(connectSSE, 3000);
      };
      return sse;
    };
    const sse = connectSSE();
    // gentle JSON poll fallback
    const intervalMs = 30000;
    timerRef.current = window.setInterval(hydrateFromJson, intervalMs);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try { sse.close(); } catch {}
      aborted = true;
    };
  }, []);

  if (!current) {
    return null;
  }

  return (
    <div className="hidden sm:flex items-center gap-2 text-xs text-white/80">
      <span className="inline-block h-2 w-2 rounded-full bg-[#3ecf8e] animate-pulse"></span>
      <span className="truncate max-w-[40vw]">Now playing: {current.name} — {current.artist}</span>
      {progressPct !== null && (
        <span className="relative inline-block h-1 w-24 rounded bg-white/10 overflow-hidden">
          <span className="absolute inset-y-0 left-0 bg-[#3ecf8e]" style={{ width: `${progressPct}%` }} />
        </span>
      )}
    </div>
  );
}


