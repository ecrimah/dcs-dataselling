import { HeroSection } from "@/components/home/hero-section";
import { LiveActivityRibbon } from "@/components/home/live-activity-ribbon";
import { HowItWorks } from "@/components/home/how-it-works";
import { NetworkCoverage } from "@/components/home/network-coverage";
import { FeaturedBundles } from "@/components/home/featured-bundles";
import { TrustSection } from "@/components/home/trust-section";
import { VendorCta } from "@/components/home/vendor-cta";
import { Faq } from "@/components/home/faq";
import { FinalCta } from "@/components/home/final-cta";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <LiveActivityRibbon />
      <HowItWorks />
      <NetworkCoverage />
      <FeaturedBundles />
      <TrustSection />
      <VendorCta />
      <Faq />
      <FinalCta />
    </>
  );
}
