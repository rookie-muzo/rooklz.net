export type NowPlayingPayload = {
  title: string;
  artist: string;
  album?: string;
  url?: string;
  durationMs?: number; // total duration
  positionMs?: number; // current position
  isPlaying: boolean;
  startedAtMs?: number; // when playback started for this track
};



