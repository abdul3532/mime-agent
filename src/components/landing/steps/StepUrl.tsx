import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Globe, CheckCircle2 } from "lucide-react";

interface Props {
  onComplete: (url: string) => void;
}

export function StepUrl({ onComplete }: Props) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    let trimmed = url.trim();
    if (!trimmed) {
      setError("Please enter a URL");
      return;
    }
    // Auto-prepend https:// if missing
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      trimmed = `https://${trimmed}`;
    }
    const urlPattern = /^https?:\/\/.+\..+/;
    if (!urlPattern.test(trimmed)) {
      setError("Please enter a valid URL (e.g. https://yourstore.com)");
      return;
    }
    setError("");
    onComplete(trimmed);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Globe className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-heading text-lg font-bold">Connect your store</h3>
          <p className="text-sm text-muted-foreground">Paste your website URL to get started</p>
        </div>
      </div>

      <div className="space-y-3">
        <Input
          placeholder="https://yourstore.com"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="h-12 text-base"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <p className="text-xs text-muted-foreground">
          Works with all websites. Best results when product pages are consistent.
        </p>
      </div>

      <Button onClick={handleSubmit} className="w-full h-11">
        Continue
      </Button>
    </motion.div>
  );
}
