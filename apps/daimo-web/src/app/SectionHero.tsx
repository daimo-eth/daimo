import Image from "next/image";
import Link from "next/link";

import {
  DownloadLinkButton,
  DownloadLinkButtonMobileNav,
} from "../components/DownloadLink";

export function SectionHero() {
  return (
    <section className="overflow-hidden pb-28">
      <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row md:gap-16 overflow-visible lg:border lg:rounded-[48px] border-white/30 lg:bg-[#000000]/20 py-16 px-12">
        <div className="flex-1 flex flex-col justify-center space-y-8 md:space-y-12">
          <HeroH1>Pay or receive USDC anywhere.</HeroH1>
          <HeroH2>
            Store money using secure hardware on your phone. Yours alone, like
            cash.
          </HeroH2>
          <div className="hidden md:flex flex-row items-center space-x-6 pt-6 md:pt-8">
            <DownloadLinkButton />
            <Link className="font-bold text-white text-2xl" href="#faq">
              Learn More<span className="font-extralight">&nbsp;&#8595;</span>
            </Link>
          </div>
        </div>
        <div className="flex-1 flex justify-center md:justify-end relative">
          <div className="mx-auto w-full max-w-[366px] py-6">
            <Image
              src="/assets/hero-screenshot.png"
              width={327}
              height={588}
              layout="responsive"
              alt="Daimo Application Screenshot"
            />
          </div>
        </div>
        <div className="md:hidden py-6">
          <DownloadLinkButtonMobileNav />
        </div>
      </div>
    </section>
  );
}

function HeroH1({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-center md:text-left text-4xl md:text-5xl lg:text-[84px] font-medium text-white lg:leading-[84px] ">
      {children}
    </h1>
  );
}

function HeroH2({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-center text-[18px] leading-6 tracking-wide md:leading-normal md:tracking-normal md:text-left lg:text-[32px] font-medium text-grayLight">
      {children}
    </h1>
  );
}
