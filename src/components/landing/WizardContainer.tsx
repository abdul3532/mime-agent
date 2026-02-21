import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Lock, Circle } from "lucide-react";
import { StepUrl } from "./steps/StepUrl";
import { StepChat } from "./steps/StepChat";
import { StepCrawl } from "./steps/StepCrawl";
import { StepInstall } from "./steps/StepInstall";

type StepStatus = "locked" | "active" | "completed";

const stepLabels = [
  "Connect your store",
  "Set priorities",
  "Scan & compile",
  "Install & verify",
];

export function WizardContainer() {
  const [currentStep, setCurrentStep] = useState(0);
  const [storeUrl, setStoreUrl] = useState("");
  const [storeId] = useState(() => `store_${Math.random().toString(36).slice(2, 10)}`);
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
    }, 100);
  };

  const advanceStep = () => {
    const next = currentStep + 1;
    setCurrentStep(next);
    scrollToStep(next);
  };

  useEffect(() => {
    if (storeUrl) {
      localStorage.setItem("mime_store_id", storeId);
      localStorage.setItem("mime_store_url", storeUrl);
    }
  }, [storeUrl, storeId]);

  return (
    <section id="wizard" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">Get started</h2>
          <p className="text-muted-foreground">Complete each step to set up your AI-friendly storefront.</p>
        </motion.div>

        {/* Progress bar */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="progress-fill h-full rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <div className="max-w-4xl mx-auto flex flex-col lg:flex-row gap-8">
          {/* Step list sidebar */}
          <div className="lg:w-56 shrink-0">
            <div className="lg:sticky lg:top-24 space-y-3">
              {stepLabels.map((label, i) => {
                const status = getStatus(i);
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-colors ${
                      status === "active" ? "bg-primary/10 text-primary" :
                      status === "completed" ? "text-accent-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {status === "completed" ? (
                      <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
                    ) : status === "active" ? (
                      <Circle className="h-5 w-5 text-primary shrink-0" />
                    ) : (
                      <Lock className="h-5 w-5 shrink-0" />
                    )}
                    <span>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active step content */}
          <div className="flex-1 space-y-6">
            {/* Step 1 */}
            <div ref={(el) => (stepRefs.current[0] = el)}>
              {currentStep === 0 && (
                <div className="card-elevated p-6 step-active">
                  <StepUrl onComplete={(url) => { setStoreUrl(url); advanceStep(); }} />
                </div>
              )}
              {currentStep > 0 && (
                <div className="card-elevated p-4 step-completed border-accent/40 opacity-70">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <span className="font-medium">Store connected</span>
                    <span className="text-muted-foreground ml-auto text-xs">{storeUrl}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2 */}
            <div ref={(el) => (stepRefs.current[1] = el)}>
              {currentStep === 1 && (
                <div className="card-elevated p-6 step-active">
                  <StepChat onComplete={advanceStep} />
                </div>
              )}
              {currentStep > 1 && (
                <div className="card-elevated p-4 step-completed border-accent/40 opacity-70">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <span className="font-medium">Priorities configured</span>
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
              {currentStep === 2 && (
                <div className="card-elevated p-6 step-active">
                  <StepCrawl storeUrl={storeUrl} onComplete={advanceStep} />
                </div>
              )}
              {currentStep > 2 && (
                <div className="card-elevated p-4 step-completed border-accent/40 opacity-70">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <span className="font-medium">Scan complete — 58 products indexed</span>
                  </div>
                </div>
              )}
              {currentStep < 2 && (
                <div className="card-elevated p-6 step-locked">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    <span>Scan & compile — complete previous steps</span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 4 */}
            <div ref={(el) => (stepRefs.current[3] = el)}>
              {currentStep === 3 && (
                <div className="card-elevated p-6 step-active">
                  <StepInstall storeId={storeId} />
                </div>
              )}
              {currentStep > 3 && (
                <div className="card-elevated p-4 step-completed border-accent/40 opacity-70">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <span className="font-medium">Published & verified</span>
                  </div>
                </div>
              )}
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
