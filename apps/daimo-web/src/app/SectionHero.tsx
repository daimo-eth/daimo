"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

import {
  DownloadLinkButton,
  DownloadLinkButtonMobileNav,
} from "../components/DownloadLink";

export function SectionHero() {
  return (
    <section className="overflow-hidden md:pb-28 px-8 m-auto max-w-screen-xl bg-[#000000]/20 lg:bg-[#000]/0">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col md:flex-row md:gap-16 overflow-visible lg:border lg:rounded-[48px] border-white/30 lg:bg-[#000000]/20 py-16 lg:pl-[96px] lg:pr-[60px]"
      >
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeInOut" }}
          className="flex-1 flex flex-col justify-center space-y-8 md:space-y-12"
        >
          <HeroH1>Pay&nbsp;or&nbsp;receive USDC anywhere.</HeroH1>
          <HeroH2>
            Store money using secure hardware on your phone. Yours alone, like
            cash.
          </HeroH2>
          <div className="hidden md:flex md:flex-row md:items-center md:space-x-[36px] md:pt-8">
            <DownloadLinkButton />
            <Link
              className="font-bold text-white text-2xl whitespace-nowrap "
              href="#features"
            >
              Learn More
              <span className="pl-4 font-extralight">&nbsp;&#8595;</span>
            </Link>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: -60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
          className="flex-1 flex justify-center items-center md:justify-end relative"
        >
          <div className="mx-auto w-full max-w-[366px] py-6 min-w-[250px]">
            <Image
              src="/assets/hero-screenshot.png"
              width={327}
              height={588}
              layout="responsive"
              alt="Daimo Application Screenshot"
            />
          </div>
        </motion.div>
        <div className="md:hidden py-6">
          <DownloadLinkButtonMobileNav />
        </div>
      </motion.div>
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
