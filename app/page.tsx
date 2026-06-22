/*
  HOMEPAGE — app/page.tsx maps to the route "/".
  It's just an ordered assembly of sections; all the substance lives in
  /components. The order follows the spec's conversion logic:
  hook (hero) → proof (listings) → SEO surface (areas) → primary lead
  magnet (home value) → trust (about, testimonials, agents) → catch-all
  (contact).
*/

import Hero from "@/components/Hero";
import FeaturedListings from "@/components/FeaturedListings";
import AreasGrid from "@/components/AreasGrid";
import HomeValueForm from "@/components/HomeValueForm";
import AboutSection from "@/components/AboutSection";
import Testimonials from "@/components/Testimonials";
import AgentsTeaser from "@/components/AgentsTeaser";
import ContactSection from "@/components/ContactSection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedListings />
      <AreasGrid />
      <HomeValueForm />
      <AboutSection />
      <Testimonials />
      <AgentsTeaser />
      <ContactSection />
    </>
  );
}
