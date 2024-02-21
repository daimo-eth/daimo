import { DownloadLink } from "./DownloadLink";
import { Logo } from "./icons/Logo";
import { LinkBold } from "./typography";

export function Header() {
  return (
    <header className="bg-white py-5">
      <div className="m-auto max-w-screen-xl px-8 flex justify-between items-stretch">
        <Logo height={24} width={24} color={"black"} />
        <HeaderNav />
      </div>
    </header>
  );
}

function HeaderNav() {
  return (
    <nav className="flex gap-8 md:gap-16 items-center">
      <LinkBold href="/blog">Blog</LinkBold>
      <LinkBold href="https://github.com/daimo-eth/daimo" target="_blank">
        Github
      </LinkBold>
      <LinkBold href="#faq">FAQ</LinkBold>
      <DownloadLink />
    </nav>
  );
}
