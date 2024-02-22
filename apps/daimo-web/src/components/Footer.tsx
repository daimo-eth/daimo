import { Logo } from "./icons/Logo";
import { TextBold, LinkBold } from "./typography";

export function Footer() {
  return (
    <header className="bg-[#111] py-16">
      <div className="flex pb-10 justify-center">
        <Logo height={24} width={24} color={"white"} />
      </div>
      <div className="m-auto max-w-screen-xl px-8 flex justify-between items-baseline">
        <TextBold>© {new Date().getFullYear()} Daimo</TextBold>
        <FooterNav />
      </div>
    </header>
  );
}

function FooterNav() {
  return (
    <div>
      <nav className="flex gap-8 md:gap-16">
        <LinkBold href="/blog">Blog</LinkBold>
        <LinkBold href="https://github.com/daimo-eth/daimo" target="_blank">
          Github
        </LinkBold>
        <LinkBold href="#faq">FAQ</LinkBold>
      </nav>
    </div>
  );
}
