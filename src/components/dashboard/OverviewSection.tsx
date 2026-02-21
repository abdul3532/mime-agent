import { motion } from "framer-motion";
import { mockProducts, getCategories } from "@/data/mockProducts";
import {
  Package, Layers, SlidersHorizontal, TrendingUp, TrendingDown,
  ArrowUpRight, Lightbulb, AlertTriangle, Star, BarChart3,
} from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// --- KPI Card ---
function KpiCard({ label, value, suffix, trend, icon: Icon, index }: {
  label: string; value: number; suffix?: string; trend?: number; icon: React.ElementType; index: number;
}) {
  const { count, ref } = useCountUp(value, 1200);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="rounded-xl border border-border/50 bg-card p-5 hover:border-border transition-colors"
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

// --- Mock chart data ---
const weeklyData = [
  { name: "Mon", queries: 42, conversions: 12 },
  { name: "Tue", queries: 58, conversions: 18 },
  { name: "Wed", queries: 65, conversions: 22 },
  { name: "Thu", queries: 51, conversions: 15 },
  { name: "Fri", queries: 78, conversions: 28 },
  { name: "Sat", queries: 90, conversions: 35 },
  { name: "Sun", queries: 72, conversions: 25 },
];

const categoryData = getCategories().map((cat) => {
  const products = mockProducts.filter((p) => p.category === cat);
  return { name: cat, products: products.length, revenue: products.reduce((s, p) => s + p.price * p.inventory * 0.1, 0) };
});

const availabilityData = [
  { name: "In Stock", value: mockProducts.filter((p) => p.availability === "in_stock").length, fill: "hsl(0 0% 85%)" },
  { name: "Low Stock", value: mockProducts.filter((p) => p.availability === "low_stock").length, fill: "hsl(0 0% 55%)" },
  { name: "Out of Stock", value: mockProducts.filter((p) => p.availability === "out_of_stock").length, fill: "hsl(0 0% 30%)" },
];

// --- Suggestions ---
const suggestions = [
  { icon: Lightbulb, title: "Boost low-stock items", desc: "5 products with < 15 units could benefit from urgency signals.", type: "tip" as const },
  { icon: AlertTriangle, title: "2 products out of stock", desc: "Retinol Night Cream and E-Reader are hidden from agents.", type: "warning" as const },
  { icon: Star, title: "Top margin opportunity", desc: "Face Mask Sheet Pack has 80% margin but low boost score.", type: "tip" as const },
  { icon: BarChart3, title: "Category gap", desc: "Food & Drink has the most products but lowest avg boost.", type: "insight" as const },
];

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
  const includedProducts = mockProducts.filter((p) => p.included);
  const avgMargin = Math.round(includedProducts.reduce((s, p) => s + p.margin, 0) / includedProducts.length);
  const avgBoost = Math.round(includedProducts.reduce((s, p) => s + p.boostScore, 0) / includedProducts.length * 10) / 10;

  const topProducts = [...includedProducts]
    .sort((a, b) => b.boostScore - a.boostScore)
    .slice(0, 5);

  const kpis = [
    { label: "Products indexed", value: mockProducts.length, icon: Package, trend: 12 },
    { label: "Categories", value: 6, icon: Layers, trend: 0 },
    { label: "Avg margin", value: avgMargin, suffix: "%", icon: TrendingUp, trend: 3 },
    { label: "Avg boost score", value: avgBoost, icon: SlidersHorizontal, trend: -2 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-bold">Overview</h2>
        <span className="text-xs text-muted-foreground">Last 7 days</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <KpiCard key={k.label} {...k} index={i} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area chart — agent queries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 rounded-xl border border-border/50 bg-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Agent Queries & Conversions</h3>
            <span className="text-xs text-muted-foreground">This week</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="queryGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(0 0% 80%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(0 0% 80%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(0 0% 50%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(0 0% 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(0 0% 45%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(0 0% 45%)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="queries" name="Queries" stroke="hsl(0 0% 80%)" fill="url(#queryGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="conversions" name="Conversions" stroke="hsl(0 0% 50%)" fill="url(#convGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Donut — availability */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border border-border/50 bg-card p-5"
        >
          <h3 className="text-sm font-semibold mb-2">Availability</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={availabilityData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={72}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
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
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.fill }} />
                <span className="text-muted-foreground flex-1">{d.name}</span>
                <span className="font-medium">{d.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Second row: bar chart + top products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar chart — revenue by category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="lg:col-span-2 rounded-xl border border-border/50 bg-card p-5"
        >
          <h3 className="text-sm font-semibold mb-4">Revenue by Category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(0 0% 45%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(0 0% 45%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" name="Est. Revenue" radius={[4, 4, 0, 0]} fill="hsl(0 0% 75%)" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Featured products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl border border-border/50 bg-card p-5"
        >
          <h3 className="text-sm font-semibold mb-3">Top Boosted Products</h3>
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <img src={p.image} alt={p.title} className="w-10 h-10 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.title}</div>
                  <div className="text-xs text-muted-foreground">€{p.price}</div>
                </div>
                <div className="text-xs font-medium px-2 py-0.5 rounded-full border border-border/50">
                  +{p.boostScore}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Suggestions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
      >
        <h3 className="text-sm font-semibold mb-3">AI Suggestions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {suggestions.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.05 }}
              className="flex items-start gap-3 rounded-xl border border-border/50 bg-card p-4 hover:border-border transition-colors cursor-pointer group"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                s.type === "warning" ? "bg-red-500/10" : s.type === "insight" ? "bg-blue-500/10" : "bg-primary/10"
              }`}>
                <s.icon className={`h-4 w-4 ${
                  s.type === "warning" ? "text-red-400" : s.type === "insight" ? "text-blue-400" : "text-primary"
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium flex items-center gap-1">
                  {s.title}
                  <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
