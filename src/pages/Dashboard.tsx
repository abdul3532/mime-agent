import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
      <aside className="hidden md:flex w-60 shrink-0 flex-col hero-gradient text-primary-foreground">
        <div className="p-5 border-b border-primary-foreground/10">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition-opacity mb-3">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </button>
          <span className="font-heading text-xl font-extrabold">MIME</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === t.id
                  ? "bg-primary-foreground/15 text-primary-foreground"
                  : "text-primary-foreground/60 hover:text-primary-foreground/90 hover:bg-primary-foreground/5"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b bg-card flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile nav */}
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
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              status === "draft" ? "status-draft" :
              status === "published" ? "status-published" : "status-verified"
            }`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
          <Button size="sm" variant="outline" onClick={handleRescan}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Re-scan
          </Button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {activeTab === "overview" && <OverviewSection />}
          {activeTab === "products" && <ProductsSection />}
          {activeTab === "rules" && <RulesSection />}
          {activeTab === "preview" && <PreviewSection storeId={storeId} />}
          {activeTab === "publish" && <PublishSection storeId={storeId} />}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
