"use client";

import { SectionFAQ } from "./SectionFAQ";
import { SectionHero } from "./SectionHero";
import { SectionTestimonial } from "./SectionTestimonial";
import { SectionWhyDaimo } from "./SectionWhyDaimo";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { HeroBackground } from "../components/HeroBackground";

export function HomePage() {
  return (
    <>
      <HeroBackground>
        <Header />
        <SectionHero />
      </HeroBackground>
      <SectionWhyDaimo />
      <SectionTestimonial />
      <SectionFAQ />
      <Footer />
    </>
  );
}
