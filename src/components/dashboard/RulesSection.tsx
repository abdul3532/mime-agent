import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, TrendingUp, TrendingDown, Ban, Sparkles } from "lucide-react";
import { mockProducts } from "@/data/mockProducts";

interface Rule {
  id: string;
  name: string;
  field: string;
  condition: string;
  value: string;
  action: string;
  amount: number;
}

const templates = [
  { name: "Bestsellers first", field: "tags", condition: "contains", value: "bestseller", action: "boost", amount: 3 },
  { name: "New arrivals boost (14 days)", field: "tags", condition: "contains", value: "new", action: "boost", amount: 2 },
  { name: "Low stock boost", field: "availability", condition: "equals", value: "low_stock", action: "boost", amount: 2 },
  { name: "High margin boost", field: "margin", condition: "greater_than", value: "65", action: "boost", amount: 2 },
  { name: "Fast shipping preference", field: "tags", condition: "contains", value: "fast-ship", action: "boost", amount: 1 },
  { name: "Exclude out-of-stock", field: "availability", condition: "equals", value: "out_of_stock", action: "exclude", amount: 0 },
  { name: "Promote bundles", field: "tags", condition: "contains", value: "bundle", action: "boost", amount: 2 },
  { name: "Price band focus (<€30)", field: "price", condition: "less_than", value: "30", action: "boost", amount: 1 },
  { name: "Category campaign", field: "category", condition: "equals", value: "Beauty", action: "boost", amount: 3 },
  { name: "Demote long delivery", field: "tags", condition: "contains", value: "slow-ship", action: "demote", amount: -2 },
];

export function RulesSection() {
  const [goal, setGoal] = useState("revenue");
  const [rules, setRules] = useState<Rule[]>([
    { id: "r1", name: "Bestsellers first", field: "tags", condition: "contains", value: "bestseller", action: "boost", amount: 3 },
    { id: "r2", name: "Exclude out-of-stock", field: "availability", condition: "equals", value: "out_of_stock", action: "exclude", amount: 0 },
  ]);
  const { toast } = useToast();

  const addTemplate = (t: typeof templates[0]) => {
    const newRule: Rule = { id: `r_${Date.now()}`, ...t };
    setRules([...rules, newRule]);
    toast({ title: "Rule added", description: t.name });
  };

  const removeRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
  };

  // Compute impact preview
  const impactProducts = [...mockProducts]
    .filter((p) => p.included)
    .map((p) => {
      let delta = 0;
      for (const r of rules) {
        if (r.action === "exclude") {
          if (r.field === "availability" && p.availability === r.value) return null;
        }
        if (r.field === "tags" && r.condition === "contains" && p.tags.includes(r.value)) delta += r.amount;
        if (r.field === "margin" && r.condition === "greater_than" && p.margin > Number(r.value)) delta += r.amount;
        if (r.field === "price" && r.condition === "less_than" && p.price < Number(r.value)) delta += r.amount;
        if (r.field === "category" && r.condition === "equals" && p.category === r.value) delta += r.amount;
      }
      return { ...p, delta, effectiveScore: p.boostScore + delta };
    })
    .filter(Boolean)
    .sort((a, b) => b!.effectiveScore - a!.effectiveScore)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl font-bold">Rules & Priorities</h2>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Rules */}
        <div className="flex-1 space-y-4">
          {/* Goal */}
          <div className="card-elevated p-4">
            <label className="text-sm font-semibold mb-2 block">Optimization goal</label>
            <Select value={goal} onValueChange={setGoal}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="conversion">Conversion</SelectItem>
                <SelectItem value="clearance">Inventory clearance</SelectItem>
                <SelectItem value="discovery">Discovery</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active rules */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Active rules ({rules.length})</h3>
            {rules.map((r) => (
              <div key={r.id} className="card-elevated p-3 flex items-center gap-3">
                <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
                  r.action === "boost" ? "bg-green-100" : r.action === "demote" ? "bg-red-100" : "bg-muted"
                }`}>
                  {r.action === "boost" ? <TrendingUp className="h-4 w-4 text-green-600" /> :
                   r.action === "demote" ? <TrendingDown className="h-4 w-4 text-red-600" /> :
                   <Ban className="h-4 w-4 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">
                    IF {r.field} {r.condition} "{r.value}" → {r.action} {r.amount !== 0 ? (r.amount > 0 ? `+${r.amount}` : r.amount) : ""}
                  </div>
                </div>
                <button onClick={() => removeRule(r.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Templates */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Add rule template</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {templates.map((t) => (
                <button
                  key={t.name}
                  onClick={() => addTemplate(t)}
                  className="card-elevated p-3 text-left text-sm hover:bg-muted/50 transition-colors flex items-center gap-2"
                >
                  <Plus className="h-3.5 w-3.5 text-primary shrink-0" />
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Impact preview */}
        <div className="lg:w-72 shrink-0">
          <div className="card-elevated p-4 lg:sticky lg:top-20">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-semibold">Rule impact preview</h3>
            </div>
            <div className="space-y-2">
              {impactProducts.map((p, i) => (
                <div key={p!.id} className="flex items-center gap-2 text-sm py-1.5 border-b last:border-0">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                  <span className="flex-1 truncate">{p!.title}</span>
                  {p!.delta !== 0 && (
                    <span className={`text-xs font-mono ${p!.delta > 0 ? "text-green-600" : "text-red-600"}`}>
                      {p!.delta > 0 ? `+${p!.delta}` : p!.delta}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
