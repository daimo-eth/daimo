import { TextBold, LinkBold } from "./typography";

export function Footer() {
  return (
    <header className="bg-white py-5">
      <div className="m-auto max-w-screen-xl px-8 flex justify-between items-baseline">
        <TextBold>© {new Date().getFullYear()} Daimo</TextBold>
        <FooterNav />
      </div>
    </header>
  );
}

function FooterNav() {
  return (
    <nav className="flex gap-8 md:gap-16">
      <LinkBold href="#faq">FAQ</LinkBold>
      <LinkBold href="/blog">Blog</LinkBold>
      <LinkBold href="https://github.com/daimo-eth/daimo" target="_blank">
        Github
      </LinkBold>
    </nav>
  );
}
