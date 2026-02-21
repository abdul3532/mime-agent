import { useState } from "react";
import { motion } from "framer-motion";
import { useDashboard } from "@/context/DashboardContext";
import { Product } from "@/data/mockProducts";
import {
  Package, SlidersHorizontal, TrendingUp, TrendingDown,
  ArrowUpRight, Lightbulb, AlertTriangle, Check,
  Eye, Zap,
} from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ProductDetailDialog } from "./ProductDetailDialog";
import { CategorySheetPanel } from "./CategorySheetPanel";

// --- KPI Card ---
function KpiCard({ label, value, suffix, trend, icon: Icon, index, onClick }: {
  label: string; value: number; suffix?: string; trend?: number; icon: React.ElementType; index: number; onClick?: () => void;
}) {
  const { count, ref } = useCountUp(value, 1200);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      onClick={onClick}
      className="rounded-xl border border-border/50 bg-card p-5 hover:border-border transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4.5 w-4.5 text-primary" />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend >= 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold font-heading tabular-nums">{count}{suffix}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      </div>
    </motion.div>
  );
}

// Suggestions that only apply when products exist
const getSuggestions = (products: Product[]) => {
  const lowStock = products.filter(p => p.inventory < 15 && p.inventory > 0);
  const outOfStock = products.filter(p => p.availability === "out_of_stock");
  const result: typeof suggestionsTemplate = [];

  if (lowStock.length > 0) result.push({
    icon: Lightbulb, title: "Boost low-stock items", desc: `${lowStock.length} products with < 15 units could benefit from urgency signals.`, type: "tip",
    apply: (prods: Product[]) => prods.map(p => p.inventory < 15 && p.inventory > 0 ? { ...p, boostScore: Math.min(p.boostScore + 2, 10) } : p),
    summary: `Boosted ${lowStock.length} low-stock products by +2`,
  });
  if (outOfStock.length > 0) result.push({
    icon: AlertTriangle, title: `${outOfStock.length} products out of stock`, desc: "Exclude them so agents don't surface unavailable items.", type: "warning",
    apply: (prods: Product[]) => prods.map(p => p.availability === "out_of_stock" ? { ...p, included: false } : p),
    summary: "Excluded out-of-stock products",
  });

  return result;
};

const suggestionsTemplate = [] as { icon: React.ElementType; title: string; desc: string; type: "tip" | "warning" | "insight"; apply: (products: Product[]) => Product[]; summary: string }[];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-card px-3 py-2 text-xs shadow-xl">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-muted-foreground">
          {p.name}: <span className="text-foreground font-medium">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

export function OverviewSection() {
  const { products, setProducts, appliedSuggestions, applySuggestion, updateProduct, seedDemoProducts, seeding } = useDashboard();
  const { toast } = useToast();

  const [kpiDialog, setKpiDialog] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [suggestionConfirm, setSuggestionConfirm] = useState<number | null>(null);
  const [availDialog, setAvailDialog] = useState<string | null>(null);

  const includedProducts = products.filter((p) => p.included);
  const totalProducts = products.length;
  const categories = [...new Set(products.map((p) => p.category))];
  const suggestions = getSuggestions(products);

  // Agent-specific KPIs (real data comes from agent_events — show 0 until connected)
  const storefrontCoverage = totalProducts > 0 ? Math.round((includedProducts.length / totalProducts) * 100) : 0;
  const avgBoost = includedProducts.length > 0 ? Math.round(includedProducts.reduce((s, p) => s + p.boostScore, 0) / includedProducts.length * 10) / 10 : 0;

  const topProducts = [...includedProducts]
    .sort((a, b) => b.boostScore - a.boostScore)
    .slice(0, 5);

  const categoryData = categories.map((cat) => {
    const prods = products.filter((p) => p.category === cat);
    const included = prods.filter((p) => p.included).length;
    return { name: cat, products: prods.length, included, coverage: prods.length > 0 ? Math.round((included / prods.length) * 100) : 0 };
  });

  const availabilityData = [
    { name: "In Stock", key: "in_stock", value: products.filter((p) => p.availability === "in_stock").length, fill: "hsl(0 0% 85%)" },
    { name: "Low Stock", key: "low_stock", value: products.filter((p) => p.availability === "low_stock").length, fill: "hsl(0 0% 55%)" },
    { name: "Out of Stock", key: "out_of_stock", value: products.filter((p) => p.availability === "out_of_stock").length, fill: "hsl(0 0% 30%)" },
  ];

  const kpis = [
    { label: "Products indexed", value: totalProducts, icon: Package, key: "coverage" },
    { label: "Included for agents", value: includedProducts.length, icon: Eye, key: "included" },
    { label: "Storefront coverage", value: storefrontCoverage, suffix: "%", icon: Zap, key: "coverage" },
    { label: "Avg boost score", value: avgBoost, icon: SlidersHorizontal, key: "boost" },
  ];

  const handleBarClick = (data: any) => {
    if (data?.name) {
      setSelectedCategory(data.name);
      setCategorySheetOpen(true);
    }
  };

  const handlePieClick = (_: any, index: number) => {
    setAvailDialog(availabilityData[index]?.key || null);
  };

  const handleApplySuggestion = (idx: number) => {
    const s = suggestions[idx];
    setProducts(s.apply(products));
    applySuggestion(idx);
    toast({ title: "Applied", description: s.summary });
    setSuggestionConfirm(null);
  };

  const availProducts = availDialog ? products.filter((p) => p.availability === availDialog) : [];

  if (products.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="font-heading text-2xl font-bold">Overview</h2>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border/50 bg-card p-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No products yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Connect your store and scan for products, or load demo data to explore the dashboard.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={seedDemoProducts} disabled={seeding}>
              {seeding ? "Loading..." : "Load demo data"}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-bold">Overview</h2>
        <span className="text-xs text-muted-foreground">Last 7 days</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <KpiCard key={k.label} {...k} index={i} onClick={() => setKpiDialog(k.key)} />
        ))}
      </div>

      {/* KPI Detail Dialog */}
      <Dialog open={!!kpiDialog} onOpenChange={(o) => !o && setKpiDialog(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {kpiDialog === "coverage" && "Storefront Coverage"}
              {kpiDialog === "included" && "Included Products"}
              {kpiDialog === "boost" && "Boost Score Breakdown"}
            </DialogTitle>
            <DialogDescription>
              {kpiDialog === "coverage" && "Percentage of your catalog that's included and discoverable by agents."}
              {kpiDialog === "included" && "Products currently included in your agent storefront."}
              {kpiDialog === "boost" && "Average boost scores by category."}
            </DialogDescription>
          </DialogHeader>

          {(kpiDialog === "coverage" || kpiDialog === "included" || kpiDialog === "boost") && (
            <div className="space-y-2">
              {categories.length === 0 && <p className="text-sm text-muted-foreground">No products yet. Add products to see coverage data.</p>}
              {categories.map((cat) => {
                const catProducts = products.filter((p) => p.category === cat);
                const included = catProducts.filter((p) => p.included).length;
                const pct = catProducts.length > 0 ? Math.round((included / catProducts.length) * 100) : 0;
                const catAvgBoost = catProducts.length > 0 ? Math.round(catProducts.reduce((s, p) => s + p.boostScore, 0) / catProducts.length * 10) / 10 : 0;
                return (
                  <div key={cat} className="rounded-lg border border-border/50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{cat}</span>
                      <span className="text-xs font-mono">{kpiDialog === "boost" ? catAvgBoost : `${pct}%`}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{included}/{catProducts.length} products included</div>
                    <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Availability Dialog */}
      <Dialog open={!!availDialog} onOpenChange={(o) => !o && setAvailDialog(null)}>
        <DialogContent className="sm:max-w-md max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{availDialog === "in_stock" ? "In Stock" : availDialog === "low_stock" ? "Low Stock" : "Out of Stock"} Products</DialogTitle>
            <DialogDescription>{availProducts.length} products</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {availProducts.length === 0 && <p className="text-sm text-muted-foreground">No products in this category.</p>}
            {availProducts.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border/50 p-2.5 cursor-pointer hover:bg-muted/30" onClick={() => { setAvailDialog(null); setSelectedProduct(p); setProductDialogOpen(true); }}>
                <img src={p.image} alt={p.title} className="w-8 h-8 rounded object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.title}</div>
                  <div className="text-xs text-muted-foreground">€{p.price} · Boost {p.boostScore}</div>
                </div>
                <Switch checked={p.included} onCheckedChange={(v) => updateProduct(p.id, { included: v })} />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 rounded-xl border border-border/50 bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Agent Coverage by Category</h3>
          </div>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData} onClick={(e) => e?.activePayload?.[0]?.payload && handleBarClick(e.activePayload[0].payload)}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(0 0% 45%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(0 0% 45%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="coverage" name="Coverage %" radius={[4, 4, 0, 0]} fill="hsl(0 0% 75%)" className="cursor-pointer" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
              No products yet. Connect your store to see coverage data.
            </div>
          )}
        </motion.div>

        {/* Donut — availability */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-xl border border-border/50 bg-card p-5">
          <h3 className="text-sm font-semibold mb-2">Product Availability</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={availabilityData}
                cx="50%" cy="50%"
                innerRadius={50} outerRadius={72}
                paddingAngle={3} dataKey="value" stroke="none"
                onClick={handlePieClick}
                className="cursor-pointer"
              >
                {availabilityData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1.5 mt-1">
            {availabilityData.map((d) => (
              <button key={d.name} onClick={() => setAvailDialog(d.key)} className="flex items-center gap-2 text-xs hover:bg-muted/30 rounded px-1 py-0.5 transition-colors">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.fill }} />
                <span className="text-muted-foreground flex-1 text-left">{d.name}</span>
                <span className="font-medium">{d.value}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Top products */}
      {topProducts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="rounded-xl border border-border/50 bg-card p-5">
          <h3 className="text-sm font-semibold mb-3">Top Boosted Products</h3>
          <div className="space-y-3">
            {topProducts.map((p) => (
              <div key={p.id} className="flex items-center gap-3 cursor-pointer hover:bg-muted/30 rounded-lg p-1 -m-1 transition-colors" onClick={() => { setSelectedProduct(p); setProductDialogOpen(true); }}>
                {p.image ? <img src={p.image} alt={p.title} className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-muted" />}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.title}</div>
                  <div className="text-xs text-muted-foreground">€{p.price}</div>
                </div>
                <div className="text-xs font-medium px-2 py-0.5 rounded-full border border-border/50">+{p.boostScore}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Category Sheet */}
      <CategorySheetPanel category={selectedCategory} open={categorySheetOpen} onOpenChange={setCategorySheetOpen} />
      {/* Product Detail Dialog */}
      <ProductDetailDialog product={selectedProduct} open={productDialogOpen} onOpenChange={setProductDialogOpen} />

      {/* Suggestion Confirm Dialog */}
      <Dialog open={suggestionConfirm !== null} onOpenChange={(o) => !o && setSuggestionConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Apply suggestion?</DialogTitle>
            <DialogDescription>
              {suggestionConfirm !== null && suggestions[suggestionConfirm]?.desc}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setSuggestionConfirm(null)}>Cancel</Button>
            <Button onClick={() => suggestionConfirm !== null && handleApplySuggestion(suggestionConfirm)}>Apply</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Suggestions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
        <h3 className="text-sm font-semibold mb-3">AI Suggestions</h3>
        {suggestions.length === 0 ? (
          <div className="rounded-xl border border-border/50 bg-card p-6 text-center text-sm text-muted-foreground">
            {products.length === 0 ? "Add products to get AI-powered optimization suggestions." : "No suggestions right now — your storefront looks good!"}
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {suggestions.map((s, i) => {
            const applied = appliedSuggestions.has(i);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.05 }}
                onClick={() => !applied && setSuggestionConfirm(i)}
                className={`flex items-start gap-3 rounded-xl border border-border/50 bg-card p-4 transition-colors group ${
                  applied ? "opacity-60" : "hover:border-border cursor-pointer"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  applied ? "bg-primary/10" : s.type === "warning" ? "bg-destructive/10" : "bg-primary/10"
                }`}>
                  {applied ? <Check className="h-4 w-4 text-primary" /> : <s.icon className={`h-4 w-4 ${
                    s.type === "warning" ? "text-destructive" : "text-primary"
                  }`} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium flex items-center gap-1">
                    {s.title}
                    {applied && <span className="text-xs text-primary font-normal ml-1">Applied</span>}
                    {!applied && <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.desc}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
        )}
      </motion.div>
    </div>
  );
}
