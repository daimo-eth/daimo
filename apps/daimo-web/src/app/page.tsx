import { SectionFAQ } from "./SectionFAQ";
import { SectionHero } from "./SectionHero";
import { SectionTestimonial } from "./SectionTestimonial";
import { SectionWhyDaimo } from "./SectionWhyDaimo";
import readmeMD from "../../../../README.md";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { HeroBackground } from "../components/HeroBackground";
import { parseFAQs } from "../utils/parseFAQ";

export default function HomePage() {
  return (
    <>
      <HeroBackground>
        <Header />
        <SectionHero />
      </HeroBackground>
      <SectionWhyDaimo />
      <SectionTestimonial />
      <SectionFAQ faq={parseFAQs(readmeMD)} />
      <Footer />
    </>
  );
}
