import { useState } from "react";
import { useNavigate } from "react-router-dom";
import mimeLogo from "@/assets/mime-logo.png";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Package, SlidersHorizontal, Eye, Rocket, RefreshCw, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OverviewSection } from "@/components/dashboard/OverviewSection";
import { ProductsSection } from "@/components/dashboard/ProductsSection";
import { RulesSection } from "@/components/dashboard/RulesSection";
import { PreviewSection } from "@/components/dashboard/PreviewSection";
import { PublishSection } from "@/components/dashboard/PublishSection";
import { useToast } from "@/hooks/use-toast";

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Package },
  { id: "rules", label: "Rules & Priorities", icon: SlidersHorizontal },
  { id: "preview", label: "Preview", icon: Eye },
  { id: "publish", label: "Publish & Verify", icon: Rocket },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [status] = useState<"draft" | "published" | "verified">("draft");
  const navigate = useNavigate();
  const { toast } = useToast();
  const storeUrl = localStorage.getItem("mime_store_url") || "https://example-store.com";
  const storeId = localStorage.getItem("mime_store_id") || "store_demo123";
  const storeName = new URL(storeUrl.startsWith("http") ? storeUrl : `https://${storeUrl}`).hostname;

  const handleRescan = () => {
    toast({ title: "Re-scanning...", description: "This will take a few seconds." });
    setTimeout(() => {
      toast({ title: "Scan complete", description: "58 products indexed." });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-card border-r border-border/50">
        <div className="p-5 border-b border-border/50">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-all duration-200 mb-4 hover:translate-x-[-2px]">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to home
          </button>
          <img src={mimeLogo} alt="MIME" className="h-14 -my-3" />
          <p className="text-xs text-muted-foreground mt-1">Storefront Manager</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium relative ${
                activeTab === t.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {activeTab === t.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-border/50">
          <div className="text-xs text-muted-foreground/50">v1.0 beta</div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b border-border/50 bg-background/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <select
              className="md:hidden bg-transparent text-sm font-medium border rounded px-2 py-1"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
            >
              {tabs.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <span className="hidden md:inline text-sm font-semibold">{storeName}</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
              status === "draft" ? "status-draft" :
              status === "published" ? "status-published" : "status-verified"
            }`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
          <Button size="sm" variant="outline" onClick={handleRescan} className="group">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5 transition-transform group-hover:rotate-180 duration-500" /> Re-scan
          </Button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "overview" && <OverviewSection />}
              {activeTab === "products" && <ProductsSection />}
              {activeTab === "rules" && <RulesSection />}
              {activeTab === "preview" && <PreviewSection storeId={storeId} />}
              {activeTab === "publish" && <PublishSection storeId={storeId} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
