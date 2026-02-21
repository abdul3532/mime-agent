import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { Product, mockProducts } from "@/data/mockProducts";

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
}

const DashboardContext = createContext<DashboardContextType | null>(null);

const defaultRules: Rule[] = [
  { id: "r1", name: "Bestsellers first", field: "tags", condition: "contains", value: "bestseller", action: "boost", amount: 3 },
  { id: "r2", name: "Exclude out-of-stock", field: "availability", condition: "equals", value: "out_of_stock", action: "exclude", amount: 0 },
];

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [rules, setRules] = useState<Rule[]>(defaultRules);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState("overview");

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  }, []);

  const applySuggestion = useCallback((index: number) => {
    setAppliedSuggestions((prev) => new Set(prev).add(index));
  }, []);

  return (
    <DashboardContext.Provider value={{
      products, setProducts, updateProduct,
      rules, setRules,
      appliedSuggestions, applySuggestion,
      activeTab, setActiveTab,
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
