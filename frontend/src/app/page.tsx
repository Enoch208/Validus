import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/features/Hero";
import { HeroDashboardReveal } from "@/components/features/HeroDashboardReveal";
import { FeaturesSection } from "@/components/features/FeaturesSection";
import { OnboardingSection } from "@/components/features/OnboardingSection";
import { FAQSection } from "@/components/features/FAQSection";
import { CommunityCTA } from "@/components/features/CommunityCTA";
import { Footer } from "@/components/layout/Footer";

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-[#06060a]">
      {/* Hero section — nebula bg scoped to just this block */}
      <section className="relative overflow-hidden">
        {/* Nebula sits at the top in its native aspect — never stretched, never upscaled past sharpness */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0">
          <Image
            src="/assets/nebula.png"
            alt=""
            width={1672}
            height={941}
            priority
            sizes="100vw"
            className="h-auto w-full opacity-90"
          />
          {/* Fade the bottom half of the image into the page bg so there's no hard edge */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-b from-transparent via-[#06060a]/70 to-[#06060a]" />
        </div>

        <Navbar />
        <Hero />

        {/* Dashboard hero render — bottom dissolves into the page bg via a mask + soft blur veil */}
        <div className="relative z-10 mx-auto mt-12 w-full max-w-6xl px-6 pb-12">
          <HeroDashboardReveal />
        </div>
      </section>

      {/* Everything below sits on the plain dark bg */}
      <FeaturesSection />
      <OnboardingSection />
      <FAQSection />
      <CommunityCTA />
      <Footer />
    </main>
  );
}
