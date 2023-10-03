import { Spacer } from "../components/layout";

export function SectionTestimonial() {
  return (
    <section className="bg-white py-32">
      <center className="m-auto max-w-screen-xl px-8">
        <div className="text-4xl font-medium text-midnight">
          I&apos;m so f*king bullish on Daimo. I could actually see myself using
          this, and I never say that about anything.
        </div>
        <Spacer h={24} />
        <div className="text-2xl font-medium text-grayMid">Kristof Gaszo</div>
        <Spacer h={8} />
        <p className="text-2xl text-grayMid">
          <a href="https://pimlico.io" target="blank" className="underline">
            Pimlico
          </a>
          , ERC-4337 coauthor
        </p>
      </center>
    </section>
  );
}
