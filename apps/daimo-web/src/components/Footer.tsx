import { Logo } from "./icons/Logo";
import { TextBold, LinkSemiBold } from "./typography";
import { useI18N } from "../i18n/context";

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
  const i18n = useI18N();
  return (
    <div>
      <nav className="flex gap-8 md:gap-16">
        <LinkSemiBold href="/blog">{i18n.misc.blog()}</LinkSemiBold>
        <LinkSemiBold href="https://github.com/daimo-eth/daimo" target="_blank">
          Github
        </LinkSemiBold>
        <LinkSemiBold href="#faq">{i18n.misc.faq()}</LinkSemiBold>
      </nav>
    </div>
  );
}
