import Image from "next/image";

import { DownloadLink } from "./DownloadLink";
import { LinkBold14 } from "./typography";

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
      <LinkBold14 href="/">Daimo</LinkBold14>
    </div>
  );
}

function HeaderNav() {
  return (
    <nav className="flex gap-8 md:gap-16 items-center">
      <LinkBold14 href="#faq">FAQ</LinkBold14>
      <LinkBold14 href="#team">Team</LinkBold14>
      <LinkBold14 href="https://github.com/daimo-eth/daimo" target="_blank">
        Github
      </LinkBold14>
      <DownloadLink />
    </nav>
  );
}
