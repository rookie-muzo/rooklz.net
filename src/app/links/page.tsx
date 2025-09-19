import { profileLinks } from "@/config/links";
import Image from "next/image";
import { getRecentChannelBlocks } from "@/lib/arena";

export const metadata = {
  title: "Links • rooklz.net",
};

export default async function LinksPage() {
  const channelSlug = process.env.ARENA_CHANNEL_SLUG || "rooklz";
  const blocks = await getRecentChannelBlocks(channelSlug, 8);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Links</h1>
      <p className="text-white/80">Public profiles I actually use, plus recent blocks from Are.na.</p>

      <div className="window variant-vista">
        <div className="titlebar px-3 py-2">Profiles</div>
        <div className="p-4">
          <ul className="list-disc pl-5 space-y-2 text-white/90">
            {profileLinks.map((link) => (
              <li key={link.label}>
                <a href={link.url || "#"} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="window variant-ng">
        <div className="titlebar px-3 py-2">Are.na — recent blocks</div>
        <div className="p-4">
          {blocks.length === 0 && (
            <div className="text-white/60 text-sm">No blocks found. Set ARENA_CHANNEL_SLUG in env.</div>
          )}
          {blocks.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {blocks.map((b) => (
                <a key={b.id} href={b.href} target="_blank" rel="noreferrer" className="block group">
                  <div className="window">
                    <div className="titlebar px-2 py-1 text-sm truncate" title={b.title}>{b.title}</div>
                    <div className="p-2">
                      {b.thumbUrl ? (
                        <Image src={b.thumbUrl} alt={b.title} width={320} height={200} className="w-full h-auto" />
                      ) : (
                        <div className="text-white/60 text-xs">{b.kind}</div>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


