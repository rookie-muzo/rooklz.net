import { NextResponse } from "next/server";
import { getRecentTracks, type RecentTrack, getTrackDurationMs } from "@/lib/lastfm";

type CacheEntry = {
  timestampMs: number;
  tracks: RecentTrack[];
  nowKey?: string;
  nowStartedAtMs?: number;
  nowDurationMs?: number | null;
};

let cache: CacheEntry | null = null;
const durationCache = new Map<string, number>();

const MIN_REFRESH_MS = process.env.NODE_ENV === "development" ? 5000 : 20000;

export async function GET() {
  const now = Date.now();
  if (cache && now - cache.timestampMs < MIN_REFRESH_MS) {
    return NextResponse.json(
      {
        tracks: cache.tracks,
        cached: true,
        nowPlayingStartedAtMs: cache.nowStartedAtMs ?? null,
        nowPlayingDurationMs: cache.nowDurationMs ?? null,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const tracks = await getRecentTracks(5);
  const current = tracks.find((t) => t.nowPlaying) || null;
  let nowKey: string | undefined = undefined;
  let nowStartedAtMs: number | undefined = undefined;
  let nowDurationMs: number | null | undefined = undefined;
  if (current) {
    nowKey = `${current.artist}::${current.name}`;
    if (cache && cache.nowKey === nowKey && cache.nowStartedAtMs) {
      nowStartedAtMs = cache.nowStartedAtMs; // preserve start if same song
      nowDurationMs = cache.nowDurationMs ?? null;
    } else {
      nowStartedAtMs = now;
      // duration lookup (with memo)
      if (durationCache.has(nowKey)) {
        nowDurationMs = durationCache.get(nowKey)!;
      } else {
        nowDurationMs = await getTrackDurationMs(current.artist, current.name);
        if (nowDurationMs) durationCache.set(nowKey, nowDurationMs);
      }
    }
  }

  cache = { timestampMs: now, tracks, nowKey, nowStartedAtMs, nowDurationMs };
  return NextResponse.json(
    {
      tracks,
      cached: false,
      nowPlayingStartedAtMs: nowStartedAtMs ?? null,
      nowPlayingDurationMs: nowDurationMs ?? null,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}


