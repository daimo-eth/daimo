import { SectionFAQ } from "./SectionFAQ";
import { SectionHero } from "./SectionHero";
import { SectionTeam } from "./SectionTeam";
import { SectionTestimonial } from "./SectionTestimonial";
import { SectionWhyDaimo } from "./SectionWhyDaimo";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";

export default function HomePage() {
  return (
    <>
      <Header />
      <SectionHero />
      <SectionWhyDaimo />
      <SectionTestimonial />
      <SectionFAQ />
      <SectionTeam />
      <Footer />
    </>
  );
}
