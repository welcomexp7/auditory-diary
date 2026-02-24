"use client";

import { useAuth } from "@/hooks/useAuth";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { BottomCTA } from "@/components/landing/BottomCTA";

export default function Home() {
  const { loginWithGoogle } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-[#0f172a] text-slate-200 overflow-x-hidden">
      <HeroSection onLogin={loginWithGoogle} />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <BottomCTA onLogin={loginWithGoogle} />
    </div>
  );
}
