import { useDashboard } from "@/context/DashboardContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

interface Props {
  category: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CategorySheetPanel({ category, open, onOpenChange }: Props) {
  const { products, updateProduct } = useDashboard();

  if (!category) return null;

  const categoryProducts = products.filter((p) => p.category === category);
  const avgMargin = categoryProducts.length
    ? Math.round(categoryProducts.reduce((s, p) => s + p.margin, 0) / categoryProducts.length)
    : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{category}</SheetTitle>
          <SheetDescription>
            {categoryProducts.length} products · Avg margin {avgMargin}%
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          {categoryProducts.map((p) => (
            <div key={p.id} className={`rounded-lg border border-border/50 p-3 space-y-2 ${!p.included ? "opacity-40" : ""}`}>
              <div className="flex items-center gap-3">
                <img src={p.image} alt={p.title} className="w-10 h-10 rounded object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.title}</div>
                  <div className="text-xs text-muted-foreground">€{p.price} · {p.margin}% margin</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-12">Boost</span>
                <Slider
                  value={[p.boostScore]}
                  onValueChange={([v]) => updateProduct(p.id, { boostScore: v })}
                  min={0} max={10} step={1}
                  className="flex-1"
                />
                <span className="text-xs font-mono w-4">{p.boostScore}</span>
                <Switch
                  checked={p.included}
                  onCheckedChange={(v) => updateProduct(p.id, { included: v })}
                />
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
