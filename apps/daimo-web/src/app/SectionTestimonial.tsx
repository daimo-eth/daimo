import { Spacer } from "../components/layout";
import { H1, H2 } from "../components/typography";

export function SectionTestimonial() {
  return (
    <section className="bg-white py-32">
      <center>
        <H1>Quote goes here</H1>
        <Spacer h={16} />
        <H2>-Bob</H2>
      </center>
    </section>
  );
}
