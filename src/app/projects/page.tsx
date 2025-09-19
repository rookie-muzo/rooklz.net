export const metadata = {
  title: "Projects • rooklz.net",
};

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Projects</h1>
      <p className="text-white/80">A dump of things I tinker with.</p>
      <div className="space-y-4">
        {["Retro UI kit", "Tiny web game", "Photo pipeline"].map((name, i) => (
          <div className={`window ${i === 1 ? "variant-ng" : i === 2 ? "variant-habbo" : ""}`} key={name}>
            <div className="titlebar px-3 py-2">{name}</div>
            <div className="p-4 text-white/80 text-sm">Description placeholder.</div>
          </div>
        ))}
      </div>
    </div>
  );
}


