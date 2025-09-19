import type { NowPlayingPayload } from "@/types/nowPlaying";

type Persisted = (NowPlayingPayload & { updatedAtMs: number }) | null;

function getKvEnv() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return { url, token };
  return null;
}

async function kvCommand<T = unknown>(command: string[]): Promise<T | null> {
  const creds = getKvEnv();
  if (!creds) return null;
  const res = await fetch(creds.url!, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creds.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ command }),
    // Edge-friendly
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { result?: T };
  return (json as any).result ?? null;
}

let memoryValue: Persisted = null;

export async function setNowPlaying(value: Persisted): Promise<void> {
  memoryValue = value;
  try {
    await kvCommand(["SET", "nowplaying", JSON.stringify(value || null)]);
  } catch {}
}

export async function getNowPlaying(): Promise<Persisted> {
  try {
    const res = await kvCommand<string>(["GET", "nowplaying"]);
    if (typeof res === "string") {
      try { return JSON.parse(res) as Persisted; } catch { return memoryValue; }
    }
  } catch {}
  return memoryValue;
}


