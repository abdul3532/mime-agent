import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Product } from "@/data/mockProducts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Rule {
  id: string;
  name: string;
  field: string;
  condition: string;
  value: string;
  action: string;
  amount: number;
}

interface DashboardContextType {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  rules: Rule[];
  setRules: React.Dispatch<React.SetStateAction<Rule[]>>;
  appliedSuggestions: Set<number>;
  applySuggestion: (index: number) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  loading: boolean;
  rescanning: boolean;
  setRescanning: (v: boolean) => void;
  lastScannedAt: Date | null;
  setLastScannedAt: (d: Date | null) => void;
  saveProducts: () => Promise<void>;
  saveRules: () => Promise<void>;
  reloadProducts: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [rescanning, setRescanning] = useState(false);
  const [lastScannedAt, setLastScannedAt] = useState<Date | null>(null);

  // Load products from DB
  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      setLoading(true);
      const { data: dbProducts } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at");

      if (dbProducts) {
        setProducts(dbProducts.map((p) => ({
          id: p.id,
          title: p.title,
          price: Number(p.price),
          currency: p.currency,
          availability: p.availability as Product["availability"],
          category: p.category,
          tags: p.tags || [],
          margin: 0,
          inventory: p.inventory,
          url: p.url || "",
          image: p.image || "",
          boostScore: p.boost_score,
          included: p.included,
        })));
        // Set last scanned from most recent product's created_at
        if (dbProducts.length > 0) {
          const latest = dbProducts.reduce((a, b) => a.created_at > b.created_at ? a : b);
          setLastScannedAt(new Date(latest.created_at));
        }
      }

      // Load rules
      const { data: dbRules } = await supabase.from("rules").select("*").eq("user_id", user.id);
      if (dbRules) {
        setRules(dbRules.map((r) => ({
          id: r.id, name: r.name, field: r.field, condition: r.condition,
          value: r.value, action: r.action, amount: r.amount,
        })));
      }

      setLoading(false);
    };
    loadData();
  }, [user]);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  }, []);

  const applySuggestion = useCallback((index: number) => {
    setAppliedSuggestions((prev) => new Set(prev).add(index));
  }, []);

  const reloadProducts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: dbProducts } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at");

    if (dbProducts) {
      setProducts(dbProducts.map((p) => ({
        id: p.id,
        title: p.title,
        price: Number(p.price),
        currency: p.currency,
        availability: p.availability as Product["availability"],
        category: p.category,
        tags: p.tags || [],
        margin: 0,
        inventory: p.inventory,
        url: p.url || "",
        image: p.image || "",
        boostScore: p.boost_score,
        included: p.included,
      })));
    }
    setLoading(false);
  }, [user]);

  const saveProducts = useCallback(async () => {
    if (!user) return;
    for (const p of products) {
      await supabase.from("products").update({
        boost_score: p.boostScore,
        included: p.included,
        tags: p.tags,
      }).eq("id", p.id).eq("user_id", user.id);
    }
    toast({ title: "Saved", description: "Products saved to database." });
  }, [user, products, toast]);

  const saveRules = useCallback(async () => {
    if (!user) return;
    await supabase.from("rules").delete().eq("user_id", user.id);
    const inserts = rules.map((r) => ({
      user_id: user.id,
      name: r.name, field: r.field, condition: r.condition,
      value: r.value, action: r.action, amount: r.amount,
    }));
    const { data } = await supabase.from("rules").insert(inserts).select();
    if (data) {
      setRules(data.map((r) => ({
        id: r.id, name: r.name, field: r.field, condition: r.condition,
        value: r.value, action: r.action, amount: r.amount,
      })));
    }
    toast({ title: "Saved", description: "Rules saved to database." });
  }, [user, rules, toast]);

    return (
    <DashboardContext.Provider value={{
      products, setProducts, updateProduct,
      rules, setRules,
      appliedSuggestions, applySuggestion,
      activeTab, setActiveTab,
      loading, rescanning, setRescanning,
      lastScannedAt, setLastScannedAt,
      saveProducts, saveRules, reloadProducts,
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
