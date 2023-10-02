import Image from "next/image";

import { Spacer } from "../components/layout";
import { SectionH3 } from "../components/typography";

export function SectionWhyDaimo() {
  return (
    <section className="bg-ivory py-24">
      <div className="m-auto max-w-screen-xl">
        <SectionH3>Why Daimo</SectionH3>
        <Spacer h={48} />
        <div className="flex gap-16">
          <WhyPellet
            icon="/assets/icon-secure.png"
            title="Secure"
            copy="Daimo uses secure hardware on your phone to secure your money, using cryptography. There's no bank. Your money is yours alone, like cash."
          />
          <WhyPellet
            icon="/assets/icon-global.png"
            title="Global"
            copy="Send and receive 1:1 backed US Dollar stablecoins to anyone, anywhere."
          />
          <WhyPellet
            icon="/assets/icon-snappy.png"
            title="Snappy"
            copy="Transfers are instant and cheap using rollups, with all the security of Ethereum under the hood."
          />
        </div>
      </div>
    </section>
  );
}

function WhyPellet({
  icon,
  title,
  copy,
}: {
  icon: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="bg-ivoryDark rounded-lg p-16 max-w-md basis-0 flex-1">
      <Image src={icon} width={84} height={84} alt={title} />
      <Spacer h={36} />
      <SectionH3>{title}</SectionH3>
      <Spacer h={36} />
      <p className="text-grayMid text-2xl">{copy}</p>
    </div>
  );
}
