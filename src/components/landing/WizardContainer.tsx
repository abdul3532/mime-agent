import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Lock, Circle, Sparkles, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepUrl } from "./steps/StepUrl";
import { StepChat } from "./steps/StepChat";
import { StepCrawl } from "./steps/StepCrawl";
import { StepInstall } from "./steps/StepInstall";


type StepStatus = "locked" | "active" | "completed";

const stepLabels = [
  "Connect your store",
  "Set priorities",
  "Scan & complete",
  "Install & verify",
];

export function WizardContainer() {
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem("mime_wizard_step");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [storeUrl, setStoreUrl] = useState(() => localStorage.getItem("mime_store_url") || "");
  const [storeId] = useState(() => localStorage.getItem("mime_store_id") || `store_${Math.random().toString(36).slice(2, 10)}`);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  const getStatus = (i: number): StepStatus => {
    if (i < currentStep) return "completed";
    if (i === currentStep) return "active";
    return "locked";
  };

  const progress = (currentStep / 4) * 100;

  const scrollToStep = (i: number) => {
    setTimeout(() => {
      stepRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  };

  const advanceStep = () => {
    const next = currentStep + 1;
    setCurrentStep(next);
    scrollToStep(next);
  };

  const goBack = () => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      scrollToStep(prev);
    }
  };

  useEffect(() => {
    localStorage.setItem("mime_wizard_step", currentStep.toString());
    if (storeUrl) {
      localStorage.setItem("mime_store_id", storeId);
      localStorage.setItem("mime_store_url", storeUrl);
    }
  }, [storeUrl, storeId, currentStep]);

  return (
    <section id="wizard" className="py-20 md:py-28 relative">
      
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-xs font-semibold tracking-widest uppercase text-primary mb-3 block">Get started</span>
          <h2 className="font-heading text-3xl md:text-5xl font-bold mb-4">
            Set up in minutes
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Complete each step to create your AI-friendly storefront.
          </p>
        </motion.div>

        {/* Progress bar */}
        <div className="max-w-5xl mx-auto mb-12">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm font-semibold text-primary">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="progress-fill h-full rounded-full relative"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              {progress > 0 && <div className="absolute right-0 top-0 w-2 h-full bg-accent/50 rounded-full animate-pulse" />}
            </motion.div>
          </div>
          {/* Step dots */}
          <div className="flex justify-between mt-3">
            {stepLabels.map((_, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  i < currentStep ? "bg-accent scale-100" :
                  i === currentStep ? "bg-primary scale-110 ring-2 ring-primary/30" :
                  "bg-muted"
                }`} />
                <span className="text-[10px] text-muted-foreground hidden sm:inline">{i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-10">
          {/* Step list sidebar */}
          <div className="lg:w-64 shrink-0">
            <div className="lg:sticky lg:top-24 space-y-3">
              {stepLabels.map((label, i) => {
                const status = getStatus(i);
                return (
                  <motion.button
                    key={i}
                    onClick={() => { if (status === "completed") { setCurrentStep(i); scrollToStep(i); } }}
                    animate={{
                      opacity: status === "locked" ? 0.4 : 1,
                      x: status === "active" ? 4 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                    className={`flex items-center gap-3 p-3.5 rounded-xl text-sm font-medium transition-colors w-full text-left ${
                      status === "active" ? "bg-primary/10 text-primary" :
                      status === "completed" ? "text-foreground hover:bg-accent/10 cursor-pointer" : "text-muted-foreground cursor-default"
                    }`}
                  >
                    {status === "completed" ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500 }}>
                        <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
                      </motion.div>
                    ) : status === "active" ? (
                      <div className="relative">
                        <Circle className="h-5 w-5 text-primary shrink-0" />
                        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                      </div>
                    ) : (
                      <Lock className="h-5 w-5 shrink-0" />
                    )}
                    <span>{label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Active step content */}
          <div className="flex-1 space-y-5">
            {/* Step 1 */}
            <div ref={(el) => (stepRefs.current[0] = el)}>
              <AnimatePresence mode="wait">
                {currentStep === 0 && (
                  <motion.div key="step1-active" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="card-elevated p-8 step-active">
                    <StepUrl onComplete={(url) => { setStoreUrl(url); advanceStep(); }} />
                  </motion.div>
                )}
              </AnimatePresence>
              {currentStep > 0 && (
                <div onClick={() => { setCurrentStep(0); scrollToStep(0); }} className="card-elevated p-4 step-completed border-accent/40 opacity-70 cursor-pointer hover:opacity-100 hover:border-primary/40 transition-all">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <span className="font-medium">Store connected</span>
                    <span className="text-muted-foreground ml-auto text-xs">{storeUrl}</span>
                    <ChevronLeft className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>

            {/* Step 2 */}
            <div ref={(el) => (stepRefs.current[1] = el)}>
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div key="step2-active" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: 0.1 }} className="card-elevated p-8 step-active">
                    <Button variant="ghost" size="sm" onClick={goBack} className="mb-3 -ml-2 text-muted-foreground hover:text-foreground">
                      <ChevronLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <StepChat onComplete={advanceStep} />
                  </motion.div>
                )}
              </AnimatePresence>
              {currentStep > 1 && (
                <div onClick={() => { setCurrentStep(1); scrollToStep(1); }} className="card-elevated p-4 step-completed border-accent/40 opacity-70 cursor-pointer hover:opacity-100 hover:border-primary/40 transition-all">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <span className="font-medium">Priorities configured</span>
                    <ChevronLeft className="h-3 w-3 text-muted-foreground ml-auto" />
                  </div>
                </div>
              )}
              {currentStep < 1 && (
                <div className="card-elevated p-6 step-locked">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    <span>Set priorities — complete Step 1 first</span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3 */}
            <div ref={(el) => (stepRefs.current[2] = el)}>
              <AnimatePresence mode="wait">
                {currentStep === 2 && (
                  <motion.div key="step3-active" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: 0.1 }} className="card-elevated p-8 step-active">
                    <Button variant="ghost" size="sm" onClick={goBack} className="mb-3 -ml-2 text-muted-foreground hover:text-foreground">
                      <ChevronLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <StepCrawl storeUrl={storeUrl} onComplete={advanceStep} />
                  </motion.div>
                )}
              </AnimatePresence>
              {currentStep > 2 && (
                <div onClick={() => { setCurrentStep(2); scrollToStep(2); }} className="card-elevated p-4 step-completed border-accent/40 opacity-70 cursor-pointer hover:opacity-100 hover:border-primary/40 transition-all">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <span className="font-medium">Scan complete — products indexed</span>
                    <ChevronLeft className="h-3 w-3 text-muted-foreground ml-auto" />
                  </div>
                </div>
              )}
              {currentStep < 2 && (
                <div className="card-elevated p-6 step-locked">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    <span>Scan & complete — complete previous steps</span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 4 */}
            <div ref={(el) => (stepRefs.current[3] = el)}>
              <AnimatePresence mode="wait">
                {currentStep === 3 && (
                  <motion.div key="step4-active" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: 0.1 }} className="card-elevated p-8 step-active">
                    <Button variant="ghost" size="sm" onClick={goBack} className="mb-3 -ml-2 text-muted-foreground hover:text-foreground">
                      <ChevronLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <StepInstall storeId={storeId} />
                  </motion.div>
                )}
              </AnimatePresence>
              {currentStep < 3 && (
                <div className="card-elevated p-6 step-locked">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    <span>Install & verify — complete previous steps</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
