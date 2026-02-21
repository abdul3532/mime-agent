import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import mimeLogo from "@/assets/mime-logo.png";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Package, SlidersHorizontal, Eye, Rocket, RefreshCw, ArrowLeft,
  Search, Bell, Settings, HelpCircle, Sun, Moon, LogOut, User,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { DashboardProvider, useDashboard } from "@/context/DashboardContext";
import { OverviewSection } from "@/components/dashboard/OverviewSection";
import { ProductsSection } from "@/components/dashboard/ProductsSection";
import { RulesSection } from "@/components/dashboard/RulesSection";
import { PreviewSection } from "@/components/dashboard/PreviewSection";
import { PublishSection } from "@/components/dashboard/PublishSection";
import { GlobalSearchCommand } from "@/components/dashboard/GlobalSearchCommand";
import { useToast } from "@/hooks/use-toast";

const navGroups = [
  {
    label: "Analytics",
    items: [{ id: "overview", label: "Overview", icon: LayoutDashboard }],
  },
  {
    label: "Storefront",
    items: [
      { id: "products", label: "Products", icon: Package },
      { id: "rules", label: "Rules & Priorities", icon: SlidersHorizontal },
      { id: "preview", label: "Preview", icon: Eye },
    ],
  },
  {
    label: "Deploy",
    items: [{ id: "publish", label: "Publish & Verify", icon: Rocket }],
  },
];

const allTabs = navGroups.flatMap((g) => g.items);

function DashboardInner() {
  const { activeTab, setActiveTab, loading, reloadProducts } = useDashboard();
  const [status] = useState<"draft" | "published" | "verified">("draft");
  const [searchOpen, setSearchOpen] = useState(false);
  const [rescanning, setRescanning] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, toggle } = useTheme();
  const { user, signOut } = useAuth();
  const storeUrl = localStorage.getItem("mime_store_url") || "";
  const storeId = localStorage.getItem("mime_store_id") || "";
  const storeName = storeUrl ? new URL(storeUrl.startsWith("http") ? storeUrl : `https://${storeUrl}`).hostname : "No store connected";

  const handleRescan = useCallback(async () => {
    if (!storeUrl) {
      toast({ title: "No store URL", description: "Connect a store first.", variant: "destructive" });
      return;
    }
    setRescanning(true);
    toast({ title: "Re-scanning...", description: "Scraping products from your store." });
    try {
      const { scrapeProducts } = await import("@/lib/api/scrapeProducts");
      const result = await scrapeProducts(storeUrl);
      if (result.success) {
        await reloadProducts();
        toast({ title: "Scan complete", description: `Found ${result.products_found} products in ${result.categories.length} categories.` });
      } else {
        toast({ title: "Scan failed", description: result.error || "Unknown error", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Scan failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally {
      setRescanning(false);
    }
  }, [storeUrl, reloadProducts, toast]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <GlobalSearchCommand open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-card border-r border-border/50">
        <div className="p-5 border-b border-border/50">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-all duration-200 mb-3 hover:translate-x-[-2px]">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to home
          </button>
          <img src={mimeLogo} alt="MIME" className={`h-12 -my-2 ${theme === "dark" ? "brightness-0 invert" : ""}`} />
        </div>

        <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 px-3 mb-1.5">{group.label}</div>
              <div className="space-y-0.5">
                {group.items.map((t) => (
                  <button key={t.id} onClick={() => setActiveTab(t.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium relative transition-colors ${
                      activeTab === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}>
                    {activeTab === t.id && (
                      <motion.div layoutId="activeTab" className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary"
                        transition={{ type: "spring", stiffness: 300, damping: 25 }} />
                    )}
                    <t.icon className="h-4 w-4" />{t.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-border/50 space-y-0.5">
          <button onClick={() => navigate("/settings")} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <Settings className="h-4 w-4" /> Settings
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <HelpCircle className="h-4 w-4" /> Help
          </button>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-muted/50 transition-colors">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>

        {/* User info */}
        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium truncate">{user?.email}</div>
              <div className="text-[10px] text-muted-foreground/40">v1.0 beta</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border/50 bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <select className="md:hidden bg-transparent text-sm font-medium border rounded px-2 py-1" value={activeTab} onChange={(e) => setActiveTab(e.target.value)}>
              {allTabs.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            <button onClick={() => setSearchOpen(true)} className="hidden md:flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-1.5 hover:bg-muted/50 transition-colors cursor-pointer">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground/50 w-52 text-left">Search products, rules... ⌘K</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden md:inline text-xs text-muted-foreground">{storeName}</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
              status === "draft" ? "border-border/50 text-muted-foreground" :
              status === "published" ? "border-emerald-500/30 text-emerald-400" : "border-blue-500/30 text-blue-400"
            }`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={toggle}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground">
              <Bell className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleRescan} disabled={rescanning} className="group h-8">
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 transition-transform ${rescanning ? "animate-spin" : "group-hover:rotate-180"} duration-500`} /> {rescanning ? "Scanning..." : "Re-scan"}
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
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
}

const Dashboard = () => (
  <DashboardProvider>
    <DashboardInner />
  </DashboardProvider>
);

export default Dashboard;
