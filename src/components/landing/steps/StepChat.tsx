import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { MessageSquare, Send, Sparkles, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  onComplete: () => void;
}

interface Message {
  role: "user" | "assistant";
  text: string;
}

const quickChips = [
  "Prioritize high-margin products",
  "Push bestsellers first",
  "Promote new arrivals for 2 weeks",
  "Down-rank out-of-stock items",
  "Boost seasonal collections",
  "Prefer items under €20 for impulse buying",
  "Favor products with strong social proof",
  "Prefer bundles / multi-packs",
  "Optimize for conversion, not clicks",
];

const aiQuestions = [
  "What's your primary goal? (Revenue / Conversion / Clear inventory / New arrivals / Brand discovery)",
  "Who's your target audience? (gift shoppers / kids / premium / budget-conscious / etc.)",
  "Any constraints? Price range, categories to exclude, or shipping regions?",
  "What should we avoid? (out-of-stock, low-margin, long delivery, etc.)",
  "Name your top 3 products or collections you'd like featured.",
];

const psychologyToggles = [
  { key: "social_proof", label: "Social proof boost", tip: "Prioritize bestsellers and 'popular' items" },
  { key: "scarcity", label: "Scarcity/urgency", tip: "Boost low stock and limited edition items" },
  { key: "price_anchor", label: "Price anchoring", tip: "Show premium next to mid-range for contrast" },
  { key: "decoy", label: "Decoy effect", tip: "Good/better/best ranking for conversion" },
  { key: "bundling", label: "Bundling & upsell", tip: "Pair complementary items together" },
  { key: "recency", label: "Recency bias", tip: "Boost new arrivals automatically" },
  { key: "choice_reduce", label: "Choice reduction", tip: "Limit top results to 8–12 items" },
  { key: "friction_reduce", label: "Friction reduction", tip: "Prefer fast shipping & easy returns" },
];

export function StepChat({ onComplete }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Hi! I'm your MIME assistant. Tell me your merchandising priorities, or use the quick chips below. I'll help you configure what AI agents see first." },
  ]);
  const [input, setInput] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedChips, setSelectedChips] = useState<Set<string>>(new Set());
  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const [canComplete, setCanComplete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const chipCount = selectedChips.size;
    const toggleCount = Object.values(toggles).filter(Boolean).length;
    const hasMessages = messages.filter((m) => m.role === "user").length > 0;
    setCanComplete(hasMessages || chipCount + toggleCount >= 2);
  }, [selectedChips, toggles, messages]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: "user", text };
    const newMessages = [...messages, userMsg];

    let aiReply: string;
    if (questionIndex < aiQuestions.length) {
      aiReply = `Got it! ${aiQuestions[questionIndex]}`;
      setQuestionIndex((q) => q + 1);
    } else {
      aiReply = "Thanks! I've noted that. Feel free to add more instructions or generate your storefront when ready.";
    }
    newMessages.push({ role: "assistant", text: aiReply });
    setMessages(newMessages);
    setInput("");
  };

  const handleChip = (chip: string) => {
    const newSet = new Set(selectedChips);
    if (newSet.has(chip)) newSet.delete(chip);
    else newSet.add(chip);
    setSelectedChips(newSet);

    if (!selectedChips.has(chip)) {
      sendMessage(chip);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <MessageSquare className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-heading text-lg font-bold">Tell MIME what to push</h3>
          <p className="text-sm text-muted-foreground">Set your merchandising priorities with AI</p>
        </div>
      </div>

      {/* Chat messages */}
      <div className="bg-muted/30 rounded-lg border p-4 h-64 overflow-y-auto space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick chips */}
      <div className="flex flex-wrap gap-2">
        {quickChips.map((chip) => (
          <button
            key={chip}
            onClick={() => handleChip(chip)}
            className={`chip text-xs ${selectedChips.has(chip) ? "chip-selected" : ""}`}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Input
          placeholder="Type your instructions..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          className="flex-1"
        />
        <Button size="icon" onClick={() => sendMessage(input)}>
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Psychology toggles */}
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="text-sm font-semibold">Commerce psychology</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {psychologyToggles.map((t) => (
            <div key={t.key} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">{t.label}</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>{t.tip}</TooltipContent>
                </Tooltip>
              </div>
              <Switch
                checked={toggles[t.key] || false}
                onCheckedChange={(v) => setToggles({ ...toggles, [t.key]: v })}
              />
            </div>
          ))}
        </div>
      </div>

      {canComplete && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Button onClick={async () => {
            // Save merchandising intent to profile (non-blocking)
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                const userNotes = messages.filter(m => m.role === "user").map(m => m.text).join("; ");
                const activeToggles = Object.entries(toggles).filter(([, v]) => v).map(([k]) => k);
                await supabase.from("profiles").update({
                  merchandising_intent: {
                    chips: [...selectedChips],
                    toggles: activeToggles,
                    notes: userNotes,
                  } as any,
                }).eq("user_id", user.id);
              }
            } catch (_) {
              // non-blocking
            }
            onComplete();
          }} className="w-full h-11">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate storefront
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
