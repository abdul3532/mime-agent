import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, CheckCircle2, Copy, ExternalLink, ChevronDown, RefreshCw, FileText, Package, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useDashboard } from "@/context/DashboardContext";
import { supabase } from "@/integrations/supabase/client";

type GenerateState = "idle" | "generating" | "complete";

interface StorefrontFile {
  llms_txt: string | null;
  llms_full_txt: string | null;
  generated_at: string;
  product_count: number;
  section_count: number;
}

const STREAM_STEPS = [
  "Loading products and active rules...",
  "Analysing catalogue structure...",
  "Decision: Grouping products into semantic sections...",
  "Enriching batch 1/2 with AI...",
  "Enriching batch 2/2 with AI...",
  "Writing llms.txt (top 20 products)...",
  "Writing llms-full.txt (all products)...",
  "Saving to storefront endpoint...",
  "Done. Your storefront is live.",
];

function generateStoreId(domain: string): string {
  const slug = domain
    .replace(/^(https?:\/\/)?(www\.)?/, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 20);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${slug}-${suffix}`;
}

export function GenerateSection() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { products, rules } = useDashboard();

  const [state, setState] = useState<GenerateState>("idle");
  const [storeId, setStoreId] = useState<string | null>(null);
  const [lastFile, setLastFile] = useState<StorefrontFile | null>(null);
  const [streamLines, setStreamLines] = useState<string[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "paijyobnnrcidapjqcln";
  const functionsBase = `https://${projectId}.supabase.co/functions/v1`;

  const includedCount = products.filter((p) => p.included).length;
  const activeRuleCount = rules.length;

  // Load store_id and last generated file
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Get or create store_id
      const { data: profile } = await supabase
        .from("profiles")
        .select("store_id, domain, store_url")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        if (profile.store_id) {
          setStoreId(profile.store_id);
        } else {
          const domain = profile.domain || profile.store_url || user.email || "store";
          const newId = generateStoreId(domain);
          await supabase.from("profiles").update({ store_id: newId } as any).eq("user_id", user.id);
          setStoreId(newId);
        }
      }

      // Get latest generated file
      const { data: files } = await supabase
        .from("storefront_files")
        .select("llms_txt, llms_full_txt, generated_at, product_count, section_count")
        .eq("user_id", user.id)
        .order("generated_at", { ascending: false })
        .limit(1);

      if (files && files.length > 0) {
        setLastFile(files[0] as StorefrontFile);
        setState("complete");
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [streamLines]);

  const handleGenerate = useCallback(async () => {
    if (!user || !storeId) return;
    setState("generating");
    setStreamLines([]);
    setStepIndex(0);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ title: "Error", description: "Not authenticated.", variant: "destructive" });
      setState("idle");
      return;
    }

    try {
      const res = await fetch(
        `${functionsBase}/generate-storefront`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok || !res.body) {
        toast({ title: "Error", description: "Could not start generation.", variant: "destructive" });
        setState("idle");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.message) {
              setStreamLines(prev => [...prev, parsed.message]);
              setStepIndex(prev => Math.min(prev + 1, STREAM_STEPS.length));
            }
            if (parsed.done) {
              const { data: files } = await supabase
                .from("storefront_files")
                .select("llms_txt, llms_full_txt, generated_at, product_count, section_count")
                .eq("user_id", user.id)
                .order("generated_at", { ascending: false })
                .limit(1);
              if (files && files.length > 0) {
                setLastFile(files[0] as StorefrontFile);
              }
              setState("complete");
              toast({ title: "Generated!", description: "Your AI storefront files are ready." });
              return;
            }
            if (parsed.error) {
              toast({ title: "Error", description: parsed.message, variant: "destructive" });
              setState("idle");
              return;
            }
          } catch { /* ignore parse errors */ }
        }
      }

      // If stream ended without done signal, check DB anyway
      const { data: files } = await supabase
        .from("storefront_files")
        .select("llms_txt, llms_full_txt, generated_at, product_count, section_count")
        .eq("user_id", user.id)
        .order("generated_at", { ascending: false })
        .limit(1);
      if (files && files.length > 0) {
        setLastFile(files[0] as StorefrontFile);
        setState("complete");
        toast({ title: "Generated!", description: "Your AI storefront files are ready." });
      } else {
        setState("idle");
      }
    } catch (err) {
      toast({ title: "Error", description: "Generation failed. Please try again.", variant: "destructive" });
      setState("idle");
    }
  }, [user, storeId, functionsBase, toast]);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard.` });
  };

  const llmsUrl = `${functionsBase}/serve-llms?store_id=${storeId}&file=llms`;
  const llmsFullUrl = `${functionsBase}/serve-llms?store_id=${storeId}&file=llms-full`;
  const snippet = `<link rel="alternate" type="text/markdown" href="${llmsUrl}" title="AI-optimised product catalogue">`;

  // --- STATE 2: GENERATING ---
  if (state === "generating") {
    const TOTAL_STEPS = 5;
    const progress = Math.min((stepIndex / TOTAL_STEPS) * 100, 100);

    return (
      <div className="space-y-6 max-w-2xl">
        <h2 className="font-heading text-2xl font-bold">Generating storefront files</h2>

        <div className="rounded-xl border bg-background p-1">
          <Progress value={progress} className="h-2" />
        </div>

        <div className="rounded-xl border bg-background/80 p-5 min-h-[320px] max-h-[400px] overflow-y-auto font-mono text-sm space-y-1">
          <AnimatePresence>
            {streamLines.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={`${line.startsWith("✓") ? "text-green-500 font-semibold" : "text-muted-foreground"}`}
              >
                {line}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={logEndRef} />
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Step {Math.min(stepIndex, TOTAL_STEPS)} of {TOTAL_STEPS}
        </p>
      </div>
    );
  }

  // --- STATE 3: COMPLETE ---
  if (state === "complete" && lastFile) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </motion.div>
          <div>
            <h2 className="font-heading text-2xl font-bold">Your AI storefront is live</h2>
            <p className="text-sm text-muted-foreground">
              Generated {new Date(lastFile.generated_at).toLocaleString()} · {lastFile.product_count} products · {lastFile.section_count} sections
            </p>
          </div>
        </div>

        {/* URL cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FileCard
            title="llms.txt"
            subtitle={`Summary file · Top 20 products`}
            url={llmsUrl}
            onCopy={() => copy(llmsUrl, "llms.txt URL")}
          />
          <FileCard
            title="llms-full.txt"
            subtitle={`Full catalogue · All ${lastFile.product_count} products`}
            url={llmsFullUrl}
            onCopy={() => copy(llmsFullUrl, "llms-full.txt URL")}
          />
        </div>

        {/* Preview */}
        {lastFile.llms_txt && (
          <Collapsible open={previewOpen} onOpenChange={setPreviewOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Preview llms.txt
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${previewOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-3 rounded-xl border bg-background/80 p-4 max-h-[400px] overflow-y-auto">
                <pre className="font-mono text-xs text-muted-foreground whitespace-pre-wrap">{lastFile.llms_txt}</pre>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setState("idle");
              setLastFile(null);
            }}
            className="flex-1"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate
          </Button>
          <Button
            onClick={() => copy(snippet, "Head snippet")}
            className="flex-1"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy snippet
          </Button>
        </div>
      </div>
    );
  }

  // --- STATE 1: PRE-GENERATE (idle) ---
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="font-heading text-2xl font-bold">Generate your AI storefront files</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Your Internal Semantic Agent analyses your catalogue, decides how to structure it, and writes
          semantically optimised Markdown files that AI shopping agents can read and cite.
        </p>
      </div>

      {/* Summary card */}
      <div className="card-elevated p-5">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
              <Package className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Products</span>
            </div>
            <div className="text-2xl font-bold">{includedCount}</div>
            <div className="text-[10px] text-muted-foreground">included</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Rules</span>
            </div>
            <div className="text-2xl font-bold">{activeRuleCount}</div>
            <div className="text-[10px] text-muted-foreground">active</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Last generated</span>
            </div>
            <div className="text-sm font-bold mt-1">
              {lastFile ? new Date(lastFile.generated_at).toLocaleDateString() : "Never"}
            </div>
          </div>
        </div>
      </div>

      <Button
        onClick={handleGenerate}
        className="w-full h-12 text-base btn-glow"
        disabled={!user || includedCount === 0}
      >
        <Sparkles className="h-5 w-5 mr-2" />
        Generate llms.txt
      </Button>

      <p className="text-xs text-muted-foreground text-center">This usually takes 20–40 seconds</p>
    </div>
  );
}

// --- Sub-components ---

function FileCard({ title, subtitle, url, onCopy }: { title: string; subtitle: string; url: string; onCopy: () => void }) {
  return (
    <div className="card-elevated p-4 space-y-3">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="code-block text-[11px] break-all">{url}</div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="flex-1 h-8" onClick={onCopy}>
          <Copy className="h-3 w-3 mr-1.5" /> Copy
        </Button>
        <Button size="sm" variant="outline" className="flex-1 h-8" asChild>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3 w-3 mr-1.5" /> Open
          </a>
        </Button>
      </div>
    </div>
  );
}

