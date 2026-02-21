import { motion } from "framer-motion";
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
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="card-interactive p-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center transition-colors duration-300 group-hover:bg-primary">
                <k.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold font-heading">{k.value}</div>
                <div className="text-xs text-muted-foreground">{k.label}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card-elevated p-5"
      >
        <h3 className="font-heading text-base font-semibold mb-4">Top results agents will see</h3>
        <div className="space-y-1">
          {topProducts.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.04 }}
              className="flex items-center gap-3 py-2.5 px-2 border-b last:border-0 rounded-lg row-hover"
            >
              <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
              <img src={p.image} alt={p.title} className="w-9 h-9 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{p.title}</div>
                <div className="text-xs text-muted-foreground">{p.category}</div>
              </div>
              <div className="text-sm font-semibold">€{p.price}</div>
              <div className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground font-medium">
                +{p.boostScore}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
