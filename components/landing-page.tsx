"use client";

import { LandingNavbar } from "@/components/landing/navbar";
import { HeroSection } from "@/components/landing/hero";
import { FeaturesSection } from "@/components/landing/features";
import { HowItWorksSection } from "@/components/landing/how-it-works";
import { UseCasesSection } from "@/components/landing/use-cases";
import { TestimonialsSection } from "@/components/landing/testimonials";
import { CTASection } from "@/components/landing/cta";
import { FooterSection } from "@/components/landing/footer";

export function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingNavbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <UseCasesSection />
      <TestimonialsSection />
      <CTASection />
      <FooterSection />
    </div>
  );
}
