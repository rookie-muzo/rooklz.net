export type ArenaBlock = {
  id: number;
  title: string;
  href: string;
  kind: "Image" | "Link" | "Text" | string;
  thumbUrl?: string;
};

type ArenaChannelResponse = {
  title?: string;
  contents?: Array<{
    id: number;
    title?: string;
    class: string;
    image?: {
      thumb?: { url?: string; width?: number; height?: number };
      display?: { url?: string; width?: number; height?: number };
    };
    source?: { url?: string };
  }>;
};

const ARENA_API = "https://api.are.na/v2";

export async function getRecentChannelBlocks(
  channelSlug: string,
  per = 8
): Promise<ArenaBlock[]> {
  if (!channelSlug) return [];
  const url = `${ARENA_API}/channels/${encodeURIComponent(channelSlug)}?per=${per}`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return [];
  const json = (await res.json()) as ArenaChannelResponse;
  const blocks = json.contents || [];
  return blocks.map((b) => ({
    id: b.id,
    title: b.title || "Untitled",
    kind: (b.class as any) || "Block",
    href: `https://www.are.na/block/${b.id}`,
    thumbUrl: b.image?.thumb?.url || b.image?.display?.url,
  }));
}


