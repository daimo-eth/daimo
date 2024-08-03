"use client";

import { SectionFAQ } from "./SectionFAQ";
import { SectionHero } from "./SectionHero";
import { SectionTestimonial } from "./SectionTestimonial";
import { SectionWhyDaimo } from "./SectionWhyDaimo";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { HeroBackground } from "../components/HeroBackground";
import { I18NProvider } from "../i18n/context";

export function HomePage({ lang }: { lang: string | null }) {
  return (
    <I18NProvider lang={lang}>
      <HeroBackground>
        <Header />
        <SectionHero />
      </HeroBackground>
      <SectionWhyDaimo />
      <SectionTestimonial />
      <SectionFAQ />
      <Footer />
    </I18NProvider>
  );
}
