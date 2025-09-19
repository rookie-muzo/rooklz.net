import NowPlayingPanel from "@/components/NowPlayingPanel";
import RecentScrobbles from "@/components/RecentScrobbles";

export default async function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Welcome to rooklz.net</h1>
      <p className="text-white/80 max-w-2xl">
        A retro-inspired personal hub. Expect photos, projects, experimental toys, and links to the places I like.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="window">
          <div className="titlebar px-3 py-2">Now Playing</div>
          <NowPlayingPanel />
          <RecentScrobbles />
        </div>
        <div className="window variant-ng">
          <div className="titlebar px-3 py-2">Latest Photo</div>
          <div className="p-4 text-sm text-white/80">See Photos page for more.</div>
        </div>
      </div>
    </div>
  );
}
