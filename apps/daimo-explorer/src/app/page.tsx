import { Header } from "../components/Header";
import { H1, H2, TextBody } from "../components/typography";

export default function Home() {
  return (
    <>
      <Header />
      <div className="h-4" />
      <main className="px-4">
        <H1>Hello world</H1>
        <div className="h-2" />
        <H2>Second header</H2>
        <div className="h-2" />
        <TextBody>
          The concept of decentralized digital currency, as well as alternative
          applications like property registries, has been around for decades.
          The anonymous e-cash protocols of the 1980s and the 1990s, mostly
          reliant on a cryptographic primitive known as Chaumian blinding,
          provided a currency with a high degree of privacy, but the protocols
          largely failed to gain traction because of their reliance on a
          centralized intermediary.
        </TextBody>
      </main>
    </>
  );
}
