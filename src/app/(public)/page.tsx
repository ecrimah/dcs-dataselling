import { HeroSection } from "@/components/home/hero-section";
import { LiveActivityRibbon } from "@/components/home/live-activity-ribbon";
import { HowItWorks } from "@/components/home/how-it-works";
import { NetworkCoverage } from "@/components/home/network-coverage";
import { TrustSection } from "@/components/home/trust-section";
import { Faq } from "@/components/home/faq";
import { FinalCta } from "@/components/home/final-cta";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <LiveActivityRibbon />
      <HowItWorks />
      <NetworkCoverage />
      <TrustSection />
      <Faq />
      <FinalCta />
    </>
  );
}
