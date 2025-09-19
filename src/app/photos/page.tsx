export const metadata = {
  title: "Photos • rooklz.net",
};

export default function PhotosPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Photos</h1>
      <p className="text-white/80">A future gallery of snapshots and textures. Hosting TBD.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div className={`window ${i % 3 === 1 ? "variant-ng" : i % 3 === 2 ? "variant-habbo" : ""}`} key={i}>
            <div className="titlebar px-3 py-2">Placeholder {i + 1}</div>
            <div className="p-4 text-white/70 text-sm">Image goes here.</div>
          </div>
        ))}
      </div>
    </div>
  );
}


