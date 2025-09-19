"use client";

import { useEffect, useState } from "react";

type Track = {
  name: string;
  artist: string;
  album?: string;
  date?: string;
  url: string;
  nowPlaying: boolean;
};

export default function RecentScrobbles() {
  const [recent, setRecent] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  const timeAgo = (iso?: string) => {
    if (!iso) return "";
    const then = new Date(iso).getTime();
    if (!Number.isFinite(then)) return "";
    const diffSec = Math.max(1, Math.floor((Date.now() - then) / 1000));
    if (diffSec < 60) return `${diffSec}s`;
    const m = Math.floor(diffSec / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d`;
    const w = Math.floor(d / 7);
    if (w < 4) return `${w}w`;
    const mo = Math.floor(d / 30.4375);
    if (mo < 12) return `${mo}mo`;
    const y = Math.floor(d / 365.25);
    return `${y}y`;
  };

  useEffect(() => {
    let mounted = true;
    const fetchScrobbles = async () => {
      try {
        const res = await fetch("/api/lastfm", { cache: "no-store" });
        const data = await res.json();
        if (!mounted) return;
        const tracks: Track[] = data.tracks || [];
        const list = tracks.filter((t) => !t.nowPlaying).slice(0, 5);
        setRecent(list);
      } catch {}
      finally { if (mounted) setLoading(false); }
    };
    fetchScrobbles();
    const id = setInterval(fetchScrobbles, 60000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  return (
    <div className="mt-4 px-4 pb-4">
      <div className="text-xs uppercase tracking-wide text-white/50 mb-2">Recent</div>
      {loading && recent.length === 0 ? (
        <div className="space-y-1">
          <div className="h-3 w-full bg-white/10 rounded" />
          <div className="h-3 w-4/5 bg-white/10 rounded" />
          <div className="h-3 w-3/5 bg-white/10 rounded" />
        </div>
      ) : recent.length === 0 ? (
        <div className="text-white/60 text-xs">No recent scrobbles.</div>
      ) : (
        <ul className="divide-y divide-white/10">
          {recent.map((t, i) => (
            <li key={`${t.name}-${t.date}-${i}`} className="py-1">
              <div className="group flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-white/30 group-hover:bg-white/60" />
                {t.url ? (
                  <a href={t.url} target="_blank" rel="noreferrer" className="flex-1 truncate text-sm text-white hover:underline">
                    {t.name}
                  </a>
                ) : (
                  <span className="flex-1 truncate text-sm text-white">{t.name}</span>
                )}
                <div className="flex items-center gap-2">
                  <a
                    href={`https://www.last.fm/music/${encodeURIComponent(t.artist)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-xs text-white/60 hover:underline"
                    title={t.artist}
                  >
                    {t.artist}
                  </a>
                  {t.date && (
                    <span className="text-[10px] text-white/40 whitespace-nowrap">{timeAgo(t.date)}</span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


