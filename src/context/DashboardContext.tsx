import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from "react";
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
  scanStep: string;
  setScanStep: (s: string) => void;
  lastScannedAt: Date | null;
  setLastScannedAt: (d: Date | null) => void;
  saveProducts: () => Promise<void>;
  saveRules: () => Promise<void>;
  reloadProducts: () => Promise<void>;
  seedDemoProducts: () => Promise<void>;
  seeding: boolean;
  computeEffectiveScore: (product: Product) => { effectiveScore: number; delta: number; matchingRules: Rule[] };
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
  const [scanStep, setScanStep] = useState("");
  const [lastScannedAt, setLastScannedAt] = useState<Date | null>(null);
  const [seeding, setSeeding] = useState(false);

  // Load products from DB
  useEffect(() => {
    if (!user) {
      // No user: empty state, no mock data
      setProducts([]);
      setLoading(false);
      return;
    }
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
          agentNotes: p.agent_notes || undefined,
        })));
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

  // Debounced auto-save for product changes (boost score, included, tags)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingUpdatesRef = useRef<Map<string, Partial<Product>>>(new Map());

  const flushProductUpdates = useCallback(async () => {
    if (!user || pendingUpdatesRef.current.size === 0) return;
    const updates = new Map(pendingUpdatesRef.current);
    pendingUpdatesRef.current.clear();

    for (const [id, changes] of updates) {
      const dbUpdates: Record<string, unknown> = {};
      if (changes.boostScore !== undefined) dbUpdates.boost_score = changes.boostScore;
      if (changes.included !== undefined) dbUpdates.included = changes.included;
      if (changes.tags !== undefined) dbUpdates.tags = changes.tags;
      if (changes.agentNotes !== undefined) dbUpdates.agent_notes = changes.agentNotes;
      if (Object.keys(dbUpdates).length > 0) {
        await supabase.from("products").update(dbUpdates).eq("id", id).eq("user_id", user.id);
      }
    }
  }, [user]);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));

    // Queue for auto-save
    const existing = pendingUpdatesRef.current.get(id) || {};
    pendingUpdatesRef.current.set(id, { ...existing, ...updates });

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      flushProductUpdates();
    }, 1500);
  }, [flushProductUpdates]);

  // Compute effective score with rules applied
  const computeEffectiveScore = useCallback((p: Product) => {
    const matchingRules: Rule[] = [];
    let delta = 0;
    for (const r of rules) {
      let matches = false;
      if (r.action === "exclude" && r.field === "availability" && p.availability === r.value) {
        matchingRules.push(r);
        continue;
      }
      if (r.field === "tags" && r.condition === "contains" && p.tags.includes(r.value)) matches = true;
      if (r.field === "price" && r.condition === "less_than" && p.price < Number(r.value)) matches = true;
      if (r.field === "price" && r.condition === "greater_than" && p.price > Number(r.value)) matches = true;
      if (r.field === "category" && r.condition === "equals" && p.category === r.value) matches = true;
      if (r.field === "availability" && r.condition === "equals" && p.availability === r.value) matches = true;
      if (r.field === "margin" && r.condition === "greater_than" && p.margin > Number(r.value)) matches = true;
      if (matches) {
        delta += r.amount;
        matchingRules.push(r);
      }
    }
    const effectiveScore = Math.max(0, Math.min(10, p.boostScore + delta));
    return { effectiveScore, delta, matchingRules };
  }, [rules]);

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
          agentNotes: p.agent_notes || undefined,
        })));
    }
    setLoading(false);
  }, [user]);

  const saveProducts = useCallback(async () => {
    if (!user) {
      toast({ title: "Demo mode", description: "Sign in to save your data." });
      return;
    }
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
    if (!user) {
      toast({ title: "Demo mode", description: "Sign in to save your data." });
      return;
    }
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

  const seedDemoProducts = useCallback(async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Sign in to load demo data.", variant: "destructive" });
      return;
    }
    setSeeding(true);
    try {
      const { mockProducts } = await import("@/data/mockProducts");
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
      await supabase.from("products").insert(inserts);
      await reloadProducts();
      toast({ title: "Demo loaded", description: "Sample products added to your dashboard." });
    } catch (e) {
      toast({ title: "Error", description: "Failed to load demo data.", variant: "destructive" });
    } finally {
      setSeeding(false);
    }
  }, [user, reloadProducts, toast]);

    return (
    <DashboardContext.Provider value={{
      products, setProducts, updateProduct,
      rules, setRules,
      appliedSuggestions, applySuggestion,
      activeTab, setActiveTab,
      loading, rescanning, setRescanning,
      scanStep, setScanStep,
      lastScannedAt, setLastScannedAt,
      saveProducts, saveRules, reloadProducts,
      seedDemoProducts, seeding,
      computeEffectiveScore,
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
