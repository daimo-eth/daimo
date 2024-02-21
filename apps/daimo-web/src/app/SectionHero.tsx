import Image from "next/image";
import Link from "next/link";

import { DownloadLinkButton } from "../components/DownloadLink";
import { Spacer } from "../components/layout";

export function SectionHero() {
  return (
    <section className="overflow-hidden pb-28">
      <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row md:gap-16 overflow-visible border rounded-[48px] border-white/30 bg-[#000000]/20 py-16 px-12">
        <div className="flex-1 flex flex-col justify-center space-y-8 md:space-y-12">
          <HeroH1>Pay or receive USDC anywhere.</HeroH1>
          <HeroH2>
            Store money using secure hardware on your phone. Yours alone, like
            cash.
          </HeroH2>
          <div className="flex flex-row items-center space-x-6 pt-6 md:pt-8">
            <DownloadLinkButton />
            <Link className="font-bold text-white text-2xl" href="#faq">
              Learn More<span className="font-extralight">&nbsp;&#8595;</span>
            </Link>
          </div>
        </div>
        <div className="flex-1 flex justify-center md:justify-end relative">
          <Image
            src="/assets/hero-screenshot.png"
            width={327} // Consider removing these if you're using Tailwind for responsiveness
            height={588} // Same as above, control size with Tailwind if possible
            alt="Screenshots"
            className="w-full max-w-[200px] md:max-w-sm " // Adjust this for different breakpoints
          />
        </div>
      </div>
    </section>
  );
}

function HeroH1({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-[84px] font-semibold text-white leading-[84px] ">
      {children}
    </h1>
  );
}

function HeroH2({ children }: { children: React.ReactNode }) {
  return <h1 className="text-[32px] text-grayLight">{children}</h1>;
}
