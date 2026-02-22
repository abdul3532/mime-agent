import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useDashboard } from "@/context/DashboardContext";
import { useCountUp } from "@/hooks/useCountUp";
import {
  Bot, Eye, ShoppingCart, TrendingUp, Package, Zap,
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface AgentEvent {
  id: string;
  event_type: string;
  agent_name: string | null;
  product_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

function KpiCard({ label, value, icon: Icon, index }: {
  label: string; value: number; icon: React.ElementType; index: number;
}) {
  const { count, ref } = useCountUp(value, 1200);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="rounded-xl border border-border/50 bg-card p-5"
    >
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="h-4.5 w-4.5 text-primary" />
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold font-heading tabular-nums">{count}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      </div>
    </motion.div>
  );
}

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

const AGENT_COLORS = [
  "hsl(var(--primary))",
  "hsl(0 0% 65%)",
  "hsl(0 0% 45%)",
  "hsl(0 0% 30%)",
  "hsl(0 0% 80%)",
];

export function AgentAnalyticsSection() {
  const { user } = useAuth();
  const { products } = useDashboard();
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const load = async () => {
      const { data } = await supabase
        .from("agent_events")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(500);
      if (data) setEvents(data as AgentEvent[]);
      setLoading(false);
    };
    load();

    // Realtime subscription for live updates
    const channel = supabase
      .channel("agent-events-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "agent_events",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setEvents((prev) => [payload.new as AgentEvent, ...prev].slice(0, 500));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const stats = useMemo(() => {
    const feedViews = events.filter((e) => e.event_type === "feed_view").length;
    const productViews = events.filter((e) => e.event_type === "product_view").length;
    const recommendations = events.filter((e) => e.event_type === "product_recommendation").length;
    const cartAdds = events.filter((e) => e.event_type === "add_to_cart").length;
    const purchases = events.filter((e) => e.event_type === "purchase").length;

    // Agent breakdown
    const agentMap = new Map<string, number>();
    events.forEach((e) => {
      const name = e.agent_name || "Unknown";
      agentMap.set(name, (agentMap.get(name) || 0) + 1);
    });
    const agentData = [...agentMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));

    // Most-viewed products
    const productViewMap = new Map<string, number>();
    events.filter((e) => e.event_type === "product_view" && e.product_id).forEach((e) => {
      productViewMap.set(e.product_id!, (productViewMap.get(e.product_id!) || 0) + 1);
    });
    const topViewedProducts = [...productViewMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([productId, views]) => {
        const product = products.find((p) => p.id === productId);
        return { productId, title: product?.title || "Unknown", image: product?.image, views };
      });

    // Conversion funnel
    const funnel = [
      { name: "Feed Views", value: feedViews },
      { name: "Product Views", value: productViews },
      { name: "Recommendations", value: recommendations },
      { name: "Cart Adds", value: cartAdds },
      { name: "Purchases", value: purchases },
    ];

    return { feedViews, productViews, recommendations, cartAdds, purchases, agentData, topViewedProducts, funnel };
  }, [events, products]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="font-heading text-2xl font-bold">Agent Analytics</h2>
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="font-heading text-2xl font-bold">Agent Analytics</h2>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border/50 bg-card p-12 text-center">
          <Bot className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No agent activity yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Once AI agents start visiting your storefront feed, you'll see visit counts, product views, and conversion signals here.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-bold">Agent Analytics</h2>
        <span className="text-xs text-muted-foreground">{events.length} events tracked</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard label="Feed views" value={stats.feedViews} icon={Eye} index={0} />
        <KpiCard label="Product views" value={stats.productViews} icon={Package} index={1} />
        <KpiCard label="Recommendations" value={stats.recommendations} icon={Zap} index={2} />
        <KpiCard label="Cart adds" value={stats.cartAdds} icon={ShoppingCart} index={3} />
        <KpiCard label="Purchases" value={stats.purchases} icon={TrendingUp} index={4} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Conversion funnel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 rounded-xl border border-border/50 bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Conversion Funnel</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.funnel} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(0 0% 45%)" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(0 0% 45%)" }} axisLine={false} tickLine={false} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Count" radius={[0, 4, 4, 0]} fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Agent breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-xl border border-border/50 bg-card p-5">
          <h3 className="text-sm font-semibold mb-2">Agents Visiting</h3>
          {stats.agentData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={stats.agentData}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={72}
                    paddingAngle={3} dataKey="value" stroke="none"
                  >
                    {stats.agentData.map((_, i) => (
                      <Cell key={i} fill={AGENT_COLORS[i % AGENT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1.5 mt-1">
                {stats.agentData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs px-1 py-0.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: AGENT_COLORS[i % AGENT_COLORS.length] }} />
                    <span className="text-muted-foreground flex-1">{d.name}</span>
                    <span className="font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No agent data yet</p>
          )}
        </motion.div>
      </div>

      {/* Most viewed products */}
      {stats.topViewedProducts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="rounded-xl border border-border/50 bg-card p-5">
          <h3 className="text-sm font-semibold mb-3">Most Viewed by Agents</h3>
          <div className="space-y-3">
            {stats.topViewedProducts.map((p, i) => (
              <div key={p.productId} className="flex items-center gap-3">
                <span className="text-xs font-mono text-muted-foreground w-5 text-right">{i + 1}</span>
                {p.image ? (
                  <img src={p.image} alt={p.title} className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.title}</div>
                </div>
                <div className="text-xs font-medium px-2 py-0.5 rounded-full border border-border/50 flex items-center gap-1">
                  <Eye className="h-3 w-3" /> {p.views}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
