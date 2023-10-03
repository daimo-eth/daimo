import Image from "next/image";

import { DownloadLinkButton } from "../components/DownloadLink";
import { Spacer } from "../components/layout";

export function SectionHero() {
  return (
    <section className="bg-[url('/assets/landing-hero-bg.png')] bg-cover bg-no-repeat py-32 overflow-hidden">
      <div className="m-auto max-w-screen-xl px-8 h-[32rem] flex overflow-visible gap-32">
        <div className="w-[24rem] mt-24">
          <HeroH1>Your dollars, worldwide</HeroH1>
          <Spacer h={8} />
          <HeroH2>Pay people or receive USDC anywhere.</HeroH2>
          <Spacer h={48} />
          <DownloadLinkButton />
        </div>
        <div className="basis-0 flex-grow relative">
          <Image
            src="/assets/landing-screenshots.png"
            width={1154}
            height={750}
            alt="Screenshots"
            className="h-[32rem] w-[49.28rem] max-w-none absolute"
          />
        </div>
      </div>
    </section>
  );
}

function HeroH1({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-[4rem] font-semibold text-midnight leading-tight">
      {children}
    </h1>
  );
}

function HeroH2({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-[2.5rem] font-medium text-grayMid leading-tight">
      {children}
    </h1>
  );
}
