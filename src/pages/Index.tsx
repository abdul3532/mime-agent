import { useRef } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Comparison } from "@/components/landing/Comparison";
import { WizardContainer } from "@/components/landing/WizardContainer";
import { Footer } from "@/components/landing/Footer";
import { PeekingMime } from "@/components/landing/PeekingMime";
import { MimeDivider } from "@/components/landing/MimeDivider";

const Index = () => {
  const mimeTrackRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-background dark">
      <Navbar />
      <main>
        <Hero />
        <div ref={mimeTrackRef}>
          <HowItWorks />
          <PeekingMime trackRef={mimeTrackRef} />
          <Comparison />
          <MimeDivider />
          <WizardContainer />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
