export const metadata = {
  title: "Playgrounds • rooklz.net",
};

export default function PlaygroundsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Playgrounds</h1>
      <p className="text-white/80">Space for applets, experiments, and web games.</p>
      <div className="window variant-habbo">
        <div className="titlebar px-3 py-2">Canvas Toy</div>
        <div className="p-4 text-white/80 text-sm">Add a WebGL/canvas sketch later.</div>
      </div>
    </div>
  );
}


