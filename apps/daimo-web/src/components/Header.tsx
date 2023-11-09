import Image from "next/image";

import { DownloadLink } from "./DownloadLink";
import { LinkBold } from "./typography";

export function Header() {
  return (
    <header className="bg-white py-5">
      <div className="m-auto max-w-screen-xl px-8 flex justify-between items-stretch">
        <HeaderLogo />
        <HeaderNav />
      </div>
    </header>
  );
}

function HeaderLogo() {
  return (
    <div className="flex gap-2 items-center">
      <Image src="/logo-web-favicon.png" width={24} height={24} alt={"Logo"} />
      <LinkBold href="/">Daimo</LinkBold>
    </div>
  );
}

function HeaderNav() {
  return (
    <nav className="flex gap-8 md:gap-16 items-center">
      <LinkBold href="#faq">FAQ</LinkBold>
      <LinkBold href="/blog">Blog</LinkBold>
      <LinkBold href="https://github.com/daimo-eth/daimo" target="_blank">
        Github
      </LinkBold>
      <DownloadLink />
    </nav>
  );
}
