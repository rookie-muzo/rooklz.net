export type RecentTrack = {
  name: string;
  artist: string;
  url: string;
  nowPlaying: boolean;
  album?: string;
  date?: string;
};

type LastfmRecentResponse = {
  recenttracks?: {
    track?: Array<{
      name?: string;
      url?: string;
      artist?: { "#text"?: string };
      album?: { "#text"?: string };
      date?: { uts?: string };
      "@attr"?: { nowplaying?: string };
    }>;
  };
};

const LASTFM_API = "https://ws.audioscrobbler.com/2.0/";

export async function getRecentTracks(limit = 5): Promise<RecentTrack[]> {
  const apiKey = process.env.LASTFM_API_KEY;
  const user = process.env.LASTFM_USERNAME || "ingvaredhelbor";
  if (!apiKey) {
    return [];
  }
  const url = `${LASTFM_API}?method=user.getrecenttracks&user=${encodeURIComponent(
    user
  )}&api_key=${apiKey}&format=json&limit=${limit}`;
  const fetchOptions =
    process.env.NODE_ENV === "development"
      ? ({ cache: "no-store" } as RequestInit)
      : ({ next: { revalidate: 60 } } as RequestInit);
  const res = await fetch(url, fetchOptions);
  if (!res.ok) return [];
  const json = (await res.json()) as LastfmRecentResponse;
  const tracks = json.recenttracks?.track || [];
  return tracks.map((t) => ({
    name: t.name || "",
    artist: t.artist?.["#text"] || "",
    album: t.album?.["#text"],
    url: t.url || "",
    nowPlaying: t["@attr"]?.nowplaying === "true",
    date: t.date?.uts ? new Date(Number(t.date.uts) * 1000).toISOString() : undefined,
  }));
}

type TrackInfoResponse = {
  track?: { duration?: string };
};

export async function getTrackDurationMs(artist: string, track: string): Promise<number | null> {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey || !artist || !track) return null;
  const url = `${LASTFM_API}?method=track.getInfo&api_key=${apiKey}&artist=${encodeURIComponent(
    artist
  )}&track=${encodeURIComponent(track)}&autocorrect=1&format=json`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  const json = (await res.json()) as TrackInfoResponse;
  const durationStr = json.track?.duration;
  if (!durationStr) return null;
  const ms = Number(durationStr);
  return Number.isFinite(ms) && ms > 0 ? ms : null;
}


