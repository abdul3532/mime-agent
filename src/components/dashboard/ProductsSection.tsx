import { useState, useMemo } from "react";
import { Product, getCategories } from "@/data/mockProducts";
import { useDashboard } from "@/context/DashboardContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight, RefreshCw, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProductDetailDialog } from "./ProductDetailDialog";

const PAGE_SIZE = 10;

function extractDomain(url: string): string {
  if (!url) return "Unknown";
  try {
    const u = url.startsWith("http") ? url : `https://${url}`;
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "Unknown";
  }
}

export function ProductsSection() {
  const { products, setProducts, updateProduct, rescanning, scanStep, seedDemoProducts, seeding, computeEffectiveScore } = useDashboard();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [availFilter, setAvailFilter] = useState<string>("all");
  const [storeFilter, setStoreFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const { toast } = useToast();
  const categories = getCategories(products);

  const stores = useMemo(() => {
    const s = new Set(products.map((p) => extractDomain(p.url)));
    return [...s].sort();
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (availFilter !== "all" && p.availability !== availFilter) return false;
      if (storeFilter !== "all" && extractDomain(p.url) !== storeFilter) return false;
      return true;
    });
  }, [products, search, categoryFilter, availFilter, storeFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageProducts = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSelect = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const toggleAll = () => {
    if (selected.size === pageProducts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pageProducts.map((p) => p.id)));
    }
  };

  const bulkAction = (action: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (!selected.has(p.id)) return p;
        switch (action) {
          case "include": return { ...p, included: true };
          case "exclude": return { ...p, included: false };
          case "boost": return { ...p, boostScore: Math.min(p.boostScore + 2, 10) };
          case "demote": return { ...p, boostScore: Math.max(p.boostScore - 2, 0) };
          default: return p;
        }
      })
    );
    toast({ title: "Updated", description: `${selected.size} products updated.` });
    setSelected(new Set());
  };

  const availLabel = (a: string) => {
    if (a === "in_stock") return "In stock";
    if (a === "low_stock") return "Low stock";
    return "Out of stock";
  };

  const scanSteps = [
    "Discovering product pages...",
    "Scraping product content...",
    "Extracting product data with AI...",
    "Saving to database...",
    "Done!",
  ];
  const currentStepIdx = scanSteps.indexOf(scanStep);

  if (rescanning) {
    return (
      <div className="space-y-4">
        <h2 className="font-heading text-2xl font-bold">Products</h2>
        <div className="card-elevated p-8 flex flex-col items-center gap-6">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          <div className="text-center">
            <p className="font-medium">Scanning your store...</p>
            <p className="text-sm text-muted-foreground mt-1">{scanStep || "Starting..."}</p>
          </div>
          <div className="w-full max-w-sm space-y-2">
            {scanSteps.slice(0, 4).map((step, i) => (
              <div key={step} className={`flex items-center gap-3 text-sm transition-colors ${
                i < currentStepIdx ? "text-primary" : i === currentStepIdx ? "text-foreground font-medium" : "text-muted-foreground/40"
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border transition-colors ${
                  i < currentStepIdx ? "bg-primary text-primary-foreground border-primary" :
                  i === currentStepIdx ? "border-primary text-primary" : "border-border"
                }`}>
                  {i < currentStepIdx ? "✓" : i + 1}
                </div>
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0 && !rescanning) {
    return (
      <div className="space-y-4">
        <h2 className="font-heading text-2xl font-bold">Products</h2>
        <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No products yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Scan your store or load demo data to see products here.
          </p>
          <Button onClick={seedDemoProducts} disabled={seeding}>
            {seeding ? "Loading..." : "Load demo data"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-2xl font-bold">Products</h2>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
        </div>
        {stores.length > 1 && (
          <Select value={storeFilter} onValueChange={(v) => { setStoreFilter(v); setPage(0); }}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Store" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stores</SelectItem>
              {stores.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(0); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={availFilter} onValueChange={(v) => { setAvailFilter(v); setPage(0); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Availability" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="in_stock">In stock</SelectItem>
            <SelectItem value="low_stock">Low stock</SelectItem>
            <SelectItem value="out_of_stock">Out of stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{selected.size} selected</span>
          <Button size="sm" variant="outline" onClick={() => bulkAction("include")}>Include</Button>
          <Button size="sm" variant="outline" onClick={() => bulkAction("exclude")}>Exclude</Button>
          <Button size="sm" variant="outline" onClick={() => bulkAction("boost")}>Boost +2</Button>
          <Button size="sm" variant="outline" onClick={() => bulkAction("demote")}>Demote −2</Button>
        </div>
      )}

      {/* Table */}
      <div className="card-elevated overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="p-3 w-10">
                <Checkbox checked={selected.size === pageProducts.length && pageProducts.length > 0} onCheckedChange={toggleAll} />
              </th>
              <th className="p-3">Product</th>
              <th className="p-3 hidden md:table-cell">Store</th>
              <th className="p-3">Price</th>
              <th className="p-3 hidden md:table-cell">Availability</th>
              <th className="p-3 hidden lg:table-cell">Category</th>
              <th className="p-3 hidden lg:table-cell">Inventory</th>
              <th className="p-3 w-36">Boost</th>
            </tr>
          </thead>
          <tbody>
            {pageProducts.map((p) => (
              <tr
                key={p.id}
                className={`border-b hover:bg-muted/30 transition-colors cursor-pointer ${!p.included ? "opacity-40" : ""}`}
                onClick={() => { setSelectedProduct(p); setDetailOpen(true); }}
              >
                <td className="p-3" onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggleSelect(p.id)} />
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.title}
                        loading="lazy"
                        className="w-8 h-8 rounded object-cover shrink-0 bg-muted"
                        onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
                      />
                    ) : null}
                    <div className={`w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0 ${p.image ? 'hidden' : ''}`}>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="font-medium truncate max-w-[180px]">{p.title}</span>
                  </div>
                </td>
                <td className="p-3 hidden md:table-cell">
                  <span className="text-xs text-muted-foreground truncate max-w-[120px] block">{extractDomain(p.url)}</span>
                </td>
                <td className="p-3 font-medium">{new Intl.NumberFormat(undefined, { style: 'currency', currency: p.currency || 'EUR' }).format(p.price)}</td>
                <td className="p-3 hidden md:table-cell">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    p.availability === "in_stock" ? "bg-green-100 text-green-700" :
                    p.availability === "low_stock" ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {availLabel(p.availability)}
                  </span>
                </td>
                <td className="p-3 hidden lg:table-cell text-muted-foreground">{p.category}</td>
                <td className="p-3 hidden lg:table-cell text-muted-foreground">{p.inventory}</td>
                <td className="p-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[p.boostScore]}
                      onValueChange={([v]) => updateProduct(p.id, { boostScore: v })}
                      min={0} max={10} step={1}
                      className="w-20"
                    />
                    <span className="text-xs font-mono w-4">{p.boostScore}</span>
                    {(() => {
                      const { delta } = computeEffectiveScore(p);
                      return delta !== 0 ? (
                        <span className={`text-xs font-mono ${delta > 0 ? "text-green-600" : "text-red-600"}`}>
                          {delta > 0 ? `+${delta}` : delta}
                        </span>
                      ) : null;
                    })()}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{filtered.length} products</span>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span>{page + 1} / {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ProductDetailDialog product={selectedProduct} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  );
}
