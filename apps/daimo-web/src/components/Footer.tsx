import { TextBold14, LinkBold14 } from "./typography";

export function Footer() {
  return (
    <header className="bg-white py-5">
      <div className="m-auto max-w-screen-xl px-8 flex justify-between items-baseline">
        <TextBold14>© {new Date().getFullYear()} Daimo</TextBold14>
        <FooterNav />
      </div>
    </header>
  );
}

function FooterNav() {
  return (
    <nav className="flex gap-8 md:gap-16">
      <LinkBold14 href="#faq">FAQ</LinkBold14>
      <LinkBold14 href="#team">Team</LinkBold14>
      <LinkBold14 href="https://github.com/daimo-eth/daimo" target="_blank">
        Github
      </LinkBold14>
    </nav>
  );
}
