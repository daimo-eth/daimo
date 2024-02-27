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
        className="flex flex-col md:flex-row md:gap-4 lg:gap-8 overflow-clip lg:border lg:rounded-[48px] border-white/30 lg:bg-[#000000]/20 py-16 lg:pl-[96px] lg:pr-[60px]"
      >
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeInOut" }}
          className="flex-1 flex flex-col justify-center space-y-8 md:space-y-12"
        >
          <HeroH1>Pay or receive USDC anywhere.</HeroH1>
          <HeroH2>
            Store money using secure hardware on your phone. Yours alone, like
            cash.
          </HeroH2>
          <div className="hidden md:flex md:flex-row md:items-center md:space-x-[20px] lg:space-x-[36px] md:pt-8">
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
          className="flex-1 flex justify-center items-center md:justify-end "
        >
          <div className="py-6 relative w-full max-w-[330px] max-h-[620px] min-h-[462px] h-[calc(100vw_*_0.92_+_220px)] sm:w-[330px] sm:h-[640px] md:h-[600px] lg:w-[400px] lg:h-[740px]">
            <PhoneScreenBackground className="absolute" />
            <Image
              src="/assets/demo.gif"
              width={400}
              height={707}
              alt="Daimo Application Screenshot"
              className="absolute"
            />
            <Image
              src="/assets/frame.png"
              width={400}
              height={707}
              alt="Daimo Application Screenshot"
              className="absolute"
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

// A white background behind the phone frame while the gif is loading
function PhoneScreenBackground(
  props: React.ComponentPropsWithoutRef<"svg"> & { color?: string }
) {
  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 750 1326"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M79 103H680V1211.31C680 1245.93 651.934 1274 617.313 1274H141.687C107.066 1274 79 1245.93 79 1211.31V103Z"
        fill={props.color || "#FFF"}
      />
    </svg>
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
