"use client";

import { Popover } from "@headlessui/react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

import { DownloadLink, DownloadLinkButtonMobileNav } from "./DownloadLink";
import { Logo } from "./icons/Logo";
import { LinkBold } from "./typography";

export function Header() {
  return (
    <header className="py-8 border-b border-b-white/30 lg:py-12 lg:border-none">
      <div className="m-auto max-w-screen-xl px-8 flex justify-between items-stretch">
        <Logo height={24} width={24} color={"white"} />
        <MobileNav />
        <HeaderNav />
      </div>
    </header>
  );
}

function HeaderNav() {
  return (
    <nav className="gap-8 md:gap-16 items-center hidden lg:flex">
      <LinkBold href="/blog">Blog</LinkBold>
      <LinkBold href="https://github.com/daimo-eth/daimo" target="_blank">
        Github
      </LinkBold>
      <LinkBold href="#faq">FAQ</LinkBold>
      <DownloadLink />
    </nav>
  );
}

function MobileNav() {
  return (
    <nav className="flex gap-8 md:gap-16 items-center lg:hidden ">
      <Popover className="lg:hidden z-50">
        {({ open }) => (
          <>
            <Popover.Button
              className="relative z-10 -m-2 inline-flex items-center rounded-lg stroke-gray-900 p-2 hover:bg-gray-200/50 hover:stroke-gray-600 active:stroke-gray-900 ui-not-focus-visible:outline-none"
              aria-label="Toggle site navigation"
            >
              {({ open }) =>
                open ? (
                  <ChevronUpIcon className="h-6 w-6 stroke-[#000]" />
                ) : (
                  <MenuIcon className="h-6 w-6 stroke-white fill-white" />
                )
              }
            </Popover.Button>
            <AnimatePresence initial={false}>
              {open && (
                <>
                  <Popover.Overlay
                    static
                    as={motion.div}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-0 bg-gray-300/60 backdrop-blur"
                  />
                  <Popover.Panel
                    static
                    as={motion.div}
                    initial={{ opacity: 0, y: -32 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{
                      opacity: 0,
                      y: -32,
                      transition: { duration: 0.2 },
                    }}
                    className="absolute inset-x-0 top-0 z-0 origin-top rounded-b-2xl bg-gray-50 px-6 pb-6 pt-32 shadow-2xl shadow-gray-900/20 bg-white"
                  >
                    <div className="absolute top-10">
                      <Logo height={24} width={24} color={"#14B174"} />
                    </div>
                    <div className="space-y-4">
                      <MobileNavLink href="/#features">Blog</MobileNavLink>
                      <MobileNavLink href="/#reviews">Github</MobileNavLink>
                      <MobileNavLink href="/#faqs">FAQ</MobileNavLink>
                    </div>
                    <div className="mt-8 flex flex-col gap-4">
                      <DownloadLinkButtonMobileNav />
                    </div>
                  </Popover.Panel>
                </>
              )}
            </AnimatePresence>
          </>
        )}
      </Popover>
    </nav>
  );
}

function MenuIcon(props: React.ComponentPropsWithoutRef<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M5 6h14M5 18h14M5 12h14"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronUpIcon(props: React.ComponentPropsWithoutRef<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M17 14l-5-5-5 5"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MobileNavLink(
  props: Omit<
    React.ComponentPropsWithoutRef<typeof Popover.Button<typeof Link>>,
    "as" | "className"
  >
) {
  return (
    <Popover.Button
      as={Link}
      className="block text-base font-medium leading-7 tracking-tight text-[#144B44]"
      {...props}
    />
  );
}
