import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, TrendingUp, TrendingDown, Ban, Sparkles, Edit2 } from "lucide-react";
import { useDashboard, Rule } from "@/context/DashboardContext";
import { Product } from "@/data/mockProducts";
import { RuleEditorDialog } from "./RuleEditorDialog";
import { ProductDetailDialog } from "./ProductDetailDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const { products, rules, setRules } = useDashboard();
  const [goal, setGoal] = useState("revenue");
  const { toast } = useToast();

  const [editRule, setEditRule] = useState<Rule | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);

  const addTemplate = (t: typeof templates[0]) => {
    const newRule: Rule = { id: `r_${Date.now()}`, ...t };
    setRules((prev) => [...prev, newRule]);
    toast({ title: "Rule added", description: t.name });
  };

  const removeRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
    setDeleteConfirm(null);
    toast({ title: "Rule removed" });
  };

  // Compute impact
  const computeRulesForProduct = (p: Product) => {
    const matching: Rule[] = [];
    let delta = 0;
    for (const r of rules) {
      let matches = false;
      if (r.action === "exclude" && r.field === "availability" && p.availability === r.value) { matching.push(r); continue; }
      if (r.field === "tags" && r.condition === "contains" && p.tags.includes(r.value)) matches = true;
      if (r.field === "margin" && r.condition === "greater_than" && p.margin > Number(r.value)) matches = true;
      if (r.field === "price" && r.condition === "less_than" && p.price < Number(r.value)) matches = true;
      if (r.field === "category" && r.condition === "equals" && p.category === r.value) matches = true;
      if (matches) { delta += r.amount; matching.push(r); }
    }
    return { delta, matching };
  };

  const impactProducts = [...products]
    .filter((p) => p.included)
    .map((p) => {
      const { delta, matching } = computeRulesForProduct(p);
      if (rules.some((r) => r.action === "exclude" && r.field === "availability" && p.availability === r.value)) return null;
      return { ...p, delta, effectiveScore: p.boostScore + delta, matchingRules: matching };
    })
    .filter(Boolean)
    .sort((a, b) => b!.effectiveScore - a!.effectiveScore)
    .slice(0, 10) as (Product & { delta: number; effectiveScore: number; matchingRules: Rule[] })[];

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl font-bold">Rules & Priorities</h2>

      <div className="flex flex-col lg:flex-row gap-6">
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
              <div key={r.id} className="card-elevated p-3 flex items-center gap-3 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => { setEditRule(r); setEditorOpen(true); }}>
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
                <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(r.id); }} className="text-muted-foreground hover:text-destructive transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Custom rule button */}
          <Button variant="outline" className="w-full" onClick={() => { setEditRule(null); setEditorOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Add custom rule
          </Button>

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

        {/* Impact preview */}
        <div className="lg:w-72 shrink-0">
          <div className="card-elevated p-4 lg:sticky lg:top-20">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-semibold">Rule impact preview</h3>
            </div>
            <TooltipProvider>
              <div className="space-y-2">
                {impactProducts.map((p, i) => (
                  <Tooltip key={p.id}>
                    <TooltipTrigger asChild>
                      <div
                        className="flex items-center gap-2 text-sm py-1.5 border-b last:border-0 cursor-pointer hover:bg-muted/30 rounded px-1 transition-colors"
                        onClick={() => { setSelectedProduct(p); setProductDialogOpen(true); }}
                      >
                        <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                        <span className="flex-1 truncate">{p.title}</span>
                        {p.delta !== 0 && (
                          <span className={`text-xs font-mono ${p.delta > 0 ? "text-green-600" : "text-red-600"}`}>
                            {p.delta > 0 ? `+${p.delta}` : p.delta}
                          </span>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-[200px]">
                      <p className="text-xs font-semibold mb-1">Rules affecting this product:</p>
                      {p.matchingRules.length > 0 ? p.matchingRules.map((r) => (
                        <p key={r.id} className="text-xs text-muted-foreground">• {r.name}</p>
                      )) : <p className="text-xs text-muted-foreground">No rules match</p>}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Rule Editor Dialog */}
      <RuleEditorDialog rule={editRule} open={editorOpen} onOpenChange={setEditorOpen} />

      {/* Product Detail Dialog */}
      <ProductDetailDialog product={selectedProduct} open={productDialogOpen} onOpenChange={setProductDialogOpen} />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete rule?</AlertDialogTitle>
            <AlertDialogDescription>This will remove the rule from your active configuration.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && removeRule(deleteConfirm)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
