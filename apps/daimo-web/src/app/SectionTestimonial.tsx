import { Spacer } from "../components/layout";

export function SectionTestimonial() {
  return (
    <section className="bg-white py-32">
      <center className="m-auto max-w-screen-xl px-16 md:px-32">
        <div className="text-4xl font-medium text-midnight">
          There are these apps that just <i>feel</i> good to use but you
          can&apos;t exactly describe why. Daimo is one of those.
        </div>
        <Spacer h={24} />
        <div className="text-2xl font-medium text-grayMid">Kristof Gazso</div>
        <Spacer h={8} />
        <p className="text-2xl text-grayMid">
          ERC-4337 coauthor, founder of{" "}
          <a href="https://pimlico.io" target="blank" className="underline">
            Pimlico
          </a>
        </p>
      </center>
    </section>
  );
}
