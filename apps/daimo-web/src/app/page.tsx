import { SectionFAQ } from "./SectionFAQ";
import { SectionHero } from "./SectionHero";
import { SectionTeam } from "./SectionTeam";
import { SectionTestimonial } from "./SectionTestimonial";
import { SectionWhyDaimo } from "./SectionWhyDaimo";
import readmeMD from "../../../../README.md";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { parseFAQs } from "../utils/parseFAQ";

export default function HomePage() {
  return (
    <>
      <Header />
      <SectionHero />
      <SectionWhyDaimo />
      <SectionTestimonial />
      <SectionFAQ faq={parseFAQs(readmeMD)} />
      <SectionTeam />
      <Footer />
    </>
  );
}
