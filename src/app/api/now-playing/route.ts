import { NextRequest, NextResponse } from "next/server";
export const runtime = "edge";
export const dynamic = "force-dynamic";
import type { NowPlayingPayload } from "@/types/nowPlaying";
import { getNowPlaying, setNowPlaying } from "@/lib/nowPlayingStore";

let lastNowPlaying: (NowPlayingPayload & { updatedAtMs: number }) | null = null;

function authOk(req: NextRequest): boolean {
  const secret = process.env.NOWPLAYING_SECRET || "";
  if (!secret) return false;
  const url = new URL(req.url);
  const qsToken = url.searchParams.get("token") || "";
  if (qsToken && qsToken === secret) return true;
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : header;
  return token === secret;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const accept = req.headers.get("accept") || "";
  const wantsJson = url.searchParams.get("format") === "json" || accept.includes("application/json");
  if (wantsJson) {
    if (!lastNowPlaying) lastNowPlaying = (await getNowPlaying()) as any;
    return NextResponse.json({ nowPlaying: lastNowPlaying });
  }

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();
  const id = ++clientSeq;
  const send = (data: string) => {
    try { return writer.write(encoder.encode(`data: ${data}\n\n`)); } catch { /* ignore */ }
  };
  const close = () => { try { writer.close(); } catch { /* ignore */ } };
  // advise client reconnect delay
  try { writer.write(encoder.encode(`retry: 3000\n\n`)); } catch {}
  // initial snapshot
  if (!lastNowPlaying) lastNowPlaying = (await getNowPlaying()) as any;
  send(JSON.stringify({ nowPlaying: lastNowPlaying }));
  // heartbeat to keep connections alive
  const interval = setInterval(() => {
    try { send(JSON.stringify({ heartbeat: Date.now() })); } catch { /* ignore */ }
  }, 25000);

  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-store",
    Connection: "keep-alive",
  });

  const response = new Response(stream.readable, {
    headers,
  });
  // cleanup on disconnect
  const cleanup = () => {
    try { clearInterval(interval); } catch {}
    const idx = clients.findIndex((c) => c.id === id);
    if (idx !== -1) clients.splice(idx, 1);
    close();
  };
  try { req.signal.addEventListener("abort", cleanup, { once: true }); } catch {}
  clients.push({ id, send, close });
  return response;
}

export async function POST(req: NextRequest) {
  if (!authOk(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const urlObj = new URL(req.url);
  let body: NowPlayingPayload | null = null;
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    body = (await req.json()) as NowPlayingPayload;
  } else if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await req.formData();
    const event = (String(form.get("event") || urlObj.searchParams.get("event") || "")).toLowerCase();
    const f = (k: string) => form.get(k) ?? form.get(`%${k}%`);
    const q = (k: string) => urlObj.searchParams.get(k) ?? urlObj.searchParams.get(`%${k}%`);
    const durationParam = (form.get("durationMs") as string) || (q("durationMs") as string) || (form.get("%length_seconds%") as string) || (q("%length_seconds%") as string) || "";
    const durMs = durationParam ? (form.get("durationMs") || q("durationMs") ? Number(durationParam) : Number(durationParam) * 1000) : undefined;
    body = {
      title: String(f("title") || q("title") || ""),
      artist: String(f("artist") || q("artist") || ""),
      album: (String(f("album") || q("album") || "") || undefined) as string | undefined,
      url: (String(form.get("url") || q("url") || "") || undefined) as string | undefined,
      durationMs: typeof durMs === "number" && Number.isFinite(durMs) ? durMs : undefined,
      positionMs: (form.get("positionMs") || q("positionMs")) ? Number((form.get("positionMs") as string) || (q("positionMs") as string)) : undefined,
      isPlaying: event ? (event === "pause" || event === "stop" ? false : true) : ((String(form.get("isPlaying") || q("isPlaying") || "true").toLowerCase()) !== "false"),
      startedAtMs: (form.get("startedAtMs") || q("startedAtMs")) ? Number((form.get("startedAtMs") as string) || (q("startedAtMs") as string)) : undefined,
    };
  } else {
    // Allow query param style
    const url = urlObj;
    const event = (url.searchParams.get("event") || "").toLowerCase();
    body = {
      title: url.searchParams.get("title") || url.searchParams.get("%title%") || "",
      artist: url.searchParams.get("artist") || url.searchParams.get("%artist%") || "",
      album: url.searchParams.get("album") || url.searchParams.get("%album%") || undefined,
      url: url.searchParams.get("url") || undefined,
      durationMs: (url.searchParams.get("durationMs") ? Number(url.searchParams.get("durationMs")) : (url.searchParams.get("%length_seconds%") ? Number(url.searchParams.get("%length_seconds%")) * 1000 : undefined)) || undefined,
      positionMs: url.searchParams.get("positionMs") ? Number(url.searchParams.get("positionMs")) : undefined,
      isPlaying: event ? (event === "pause" || event === "stop" ? false : true) : ((url.searchParams.get("isPlaying") || "true").toLowerCase() !== "false"),
      startedAtMs: url.searchParams.get("startedAtMs") ? Number(url.searchParams.get("startedAtMs")) : undefined,
    };
  }
  const nowMs = Date.now();
  const incoming = body as NowPlayingPayload;
  // Ignore malformed play/unpause updates with no title & artist
  if ((incoming.isPlaying === true) && !incoming.title && !incoming.artist) {
    return NextResponse.json({ ok: true, ignored: true });
  }
  let startedAtMs = incoming.startedAtMs;
  // derive startedAt from provided position if missing
  if (!startedAtMs && typeof incoming.positionMs === "number" && incoming.positionMs >= 0) {
    startedAtMs = nowMs - incoming.positionMs;
  }
  // handle pause/unpause adjustments without explicit position
  if (!startedAtMs && lastNowPlaying?.startedAtMs) {
    if (incoming.isPlaying === false) {
      // pause: compute and store position
      incoming.positionMs = Math.max(0, nowMs - lastNowPlaying.startedAtMs);
      startedAtMs = lastNowPlaying.startedAtMs;
    } else if (incoming.isPlaying === true && typeof lastNowPlaying.positionMs === "number") {
      // unpause: resume from last known position
      startedAtMs = nowMs - lastNowPlaying.positionMs;
    }
  }
  // if stop: clear payload
  if (incoming.isPlaying === false && (!incoming.title && !incoming.artist) && !incoming.durationMs) {
    lastNowPlaying = null;
    await setNowPlaying(null);
    broadcast(null);
    return NextResponse.json({ ok: true });
  }
  if (!startedAtMs && incoming.isPlaying) startedAtMs = nowMs;
  const prev = lastNowPlaying || null;
  const entry = {
    title: incoming.title || prev?.title || "",
    artist: incoming.artist || prev?.artist || "",
    album: incoming.album ?? prev?.album,
    url: incoming.url ?? prev?.url,
    durationMs: incoming.durationMs ?? prev?.durationMs,
    positionMs: incoming.positionMs ?? prev?.positionMs,
    isPlaying: incoming.isPlaying,
    startedAtMs,
    updatedAtMs: nowMs,
  } as NowPlayingPayload & { updatedAtMs: number };
  lastNowPlaying = entry;
  await setNowPlaying(entry);
  broadcast(entry);
  return NextResponse.json({ ok: true });
}

// Simple in-memory SSE broker
type Client = { id: number; send: (data: string) => void; close: () => void };
const clients: Client[] = [];
let clientSeq = 0;

// PUT handler removed; SSE now served via GET. Use `?format=json` for JSON snapshot.

function broadcast(payload: unknown) {
  const msg = JSON.stringify({ nowPlaying: payload });
  for (let i = clients.length - 1; i >= 0; i--) {
    const c = clients[i];
    try { c.send(msg); }
    catch {
      try { c.close(); } catch {}
      clients.splice(i, 1);
    }
  }
}



