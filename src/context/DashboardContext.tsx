import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Product, mockProducts } from "@/data/mockProducts";
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
  saveProducts: () => Promise<void>;
  saveRules: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

const defaultRules: Rule[] = [
  { id: "r1", name: "Bestsellers first", field: "tags", condition: "contains", value: "bestseller", action: "boost", amount: 3 },
  { id: "r2", name: "Exclude out-of-stock", field: "availability", condition: "equals", value: "out_of_stock", action: "exclude", amount: 0 },
];

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [rules, setRules] = useState<Rule[]>(defaultRules);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

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

      if (dbProducts && dbProducts.length > 0) {
        setProducts(dbProducts.map((p) => ({
          id: p.id,
          title: p.title,
          price: Number(p.price),
          currency: p.currency,
          availability: p.availability as Product["availability"],
          category: p.category,
          tags: p.tags || [],
          margin: 0, // not stored in DB, computed or mock
          inventory: p.inventory,
          url: p.url || "",
          image: p.image || "",
          boostScore: p.boost_score,
          included: p.included,
        })));
      } else {
        // First time: seed with mock data
        const inserts = mockProducts.map((p) => ({
          user_id: user.id,
          title: p.title,
          price: p.price,
          currency: p.currency,
          availability: p.availability,
          category: p.category,
          tags: p.tags,
          inventory: p.inventory,
          url: p.url,
          image: p.image,
          boost_score: p.boostScore,
          included: p.included,
        }));
        const { data: seeded } = await supabase.from("products").insert(inserts).select();
        if (seeded) {
          setProducts(seeded.map((p) => ({
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
      }

      // Load rules
      const { data: dbRules } = await supabase.from("rules").select("*").eq("user_id", user.id);
      if (dbRules && dbRules.length > 0) {
        setRules(dbRules.map((r) => ({
          id: r.id, name: r.name, field: r.field, condition: r.condition,
          value: r.value, action: r.action, amount: r.amount,
        })));
      } else {
        // Seed default rules
        const ruleInserts = defaultRules.map((r) => ({
          user_id: user.id, name: r.name, field: r.field, condition: r.condition,
          value: r.value, action: r.action, amount: r.amount,
        }));
        const { data: seededRules } = await supabase.from("rules").insert(ruleInserts).select();
        if (seededRules) {
          setRules(seededRules.map((r) => ({
            id: r.id, name: r.name, field: r.field, condition: r.condition,
            value: r.value, action: r.action, amount: r.amount,
          })));
        }
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
    // Delete all, re-insert
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
      loading, saveProducts, saveRules,
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
