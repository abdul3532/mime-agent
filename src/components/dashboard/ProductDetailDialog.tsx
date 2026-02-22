import { useState, useEffect } from "react";
import { Product } from "@/data/mockProducts";
import { useDashboard } from "@/context/DashboardContext";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface Props {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductDetailDialog({ product, open, onOpenChange }: Props) {
  const { updateProduct } = useDashboard();
  const [boost, setBoost] = useState(0);
  const [included, setIncluded] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [agentNotes, setAgentNotes] = useState("");

  useEffect(() => {
    if (product) {
      setBoost(product.boostScore);
      setIncluded(product.included);
      setTags([...product.tags]);
      setAgentNotes(product.agentNotes || "");
    }
  }, [product]);

  if (!product) return null;

  const handleSave = () => {
    updateProduct(product.id, { boostScore: boost, included, tags, agentNotes: agentNotes || undefined });
    onOpenChange(false);
  };

  const addTag = () => {
    const t = newTag.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const availLabel = (a: string) =>
    a === "in_stock" ? "In stock" : a === "low_stock" ? "Low stock" : "Out of stock";

  const availColor = (a: string) =>
    a === "in_stock" ? "bg-green-100 text-green-700" : a === "low_stock" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Product Details</DialogTitle>
          <DialogDescription>Edit boost, tags, and inclusion for this product.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Header */}
          <div className="flex gap-4">
            <img src={product.image} alt={product.title} className="w-20 h-20 rounded-lg object-cover shrink-0" />
            <div className="min-w-0">
              <h3 className="font-semibold text-base truncate">{product.title}</h3>
              <p className="text-sm text-muted-foreground">{product.category}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-bold">€{product.price}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${availColor(product.availability)}`}>
                  {availLabel(product.availability)}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border/50 p-3">
              <div className="text-xs text-muted-foreground">Margin</div>
              <div className="text-lg font-bold">{product.margin}%</div>
            </div>
            <div className="rounded-lg border border-border/50 p-3">
              <div className="text-xs text-muted-foreground">Inventory</div>
              <div className="text-lg font-bold">{product.inventory}</div>
            </div>
          </div>

          {/* Boost */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">Boost Score</label>
              <span className="text-sm font-mono font-bold">{boost}</span>
            </div>
            <Slider value={[boost]} onValueChange={([v]) => setBoost(v)} min={0} max={10} step={1} />
          </div>

          {/* Include */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold">Include in storefront</label>
            <Switch checked={included} onCheckedChange={setIncluded} />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <Badge key={t} variant="secondary" className="gap-1">
                  {t}
                  <button onClick={() => removeTag(t)} className="ml-0.5 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                className="h-8 text-sm"
              />
              <Button size="sm" variant="outline" onClick={addTag} className="h-8">Add</Button>
            </div>
          </div>

          {/* Agent Notes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">Notes to agent</label>
              <span className="text-xs text-muted-foreground">{agentNotes.length}/280</span>
            </div>
            <Textarea
              placeholder="e.g. This is our bestseller for Christmas. Highlight the limited stock."
              value={agentNotes}
              onChange={(e) => {
                if (e.target.value.length <= 280) setAgentNotes(e.target.value);
              }}
              className="resize-none h-20 text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
