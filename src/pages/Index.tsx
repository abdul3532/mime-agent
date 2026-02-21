import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Comparison } from "@/components/landing/Comparison";
import { WizardContainer } from "@/components/landing/WizardContainer";
import { Footer } from "@/components/landing/Footer";
import { PeekingMime } from "@/components/landing/PeekingMime";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <div className="relative">
          <PeekingMime />
          <Comparison />
          <WizardContainer />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
