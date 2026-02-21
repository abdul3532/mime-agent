import { mockProducts } from "@/data/mockProducts";
import { Package, Layers, SlidersHorizontal, TrendingUp } from "lucide-react";

export function OverviewSection() {
  const topProducts = [...mockProducts]
    .filter((p) => p.included)
    .sort((a, b) => b.boostScore - a.boostScore)
    .slice(0, 10);

  const kpis = [
    { label: "Products indexed", value: mockProducts.length, icon: Package },
    { label: "Categories", value: 6, icon: Layers },
    { label: "Rules active", value: 9, icon: SlidersHorizontal },
    { label: "Avg boost score", value: "6.2", icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl font-bold">Overview</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="card-elevated p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <k.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold font-heading">{k.value}</div>
                <div className="text-xs text-muted-foreground">{k.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card-elevated p-5">
        <h3 className="font-heading text-base font-semibold mb-4">Top results agents will see</h3>
        <div className="space-y-2">
          {topProducts.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 py-2 border-b last:border-0">
              <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
              <img src={p.image} alt={p.title} className="w-8 h-8 rounded object-cover" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{p.title}</div>
                <div className="text-xs text-muted-foreground">{p.category}</div>
              </div>
              <div className="text-sm font-semibold">€{p.price}</div>
              <div className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground font-medium">
                +{p.boostScore}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
