import Image from "next/image";

import { Spacer } from "../components/layout";
import { SectionH3 } from "../components/typography";

export function SectionWhyDaimo() {
  return (
    <section className="bg-ivory py-24">
      <div className="m-auto max-w-screen-xl px-8">
        <SectionH3>Why Daimo</SectionH3>
        <Spacer h={48} />
        <div className="flex gap-16">
          <WhyPellet
            icon="/assets/ionicon-hardware-chip.svg"
            title="Secure"
            copy="Store money using secure hardware on your phone. Yours alone, like cash."
          />
          <WhyPellet
            icon="/assets/ionicon-earth.svg"
            title="Global"
            copy="Receive USDC from anyone. Send anywhere, including to .eth addresses."
          />
          <WhyPellet
            icon="/assets/ionicon-checkmark-circle.svg"
            title="Snappy"
            copy="Transfers are instant on rollups, with all the security of Ethereum under the hood."
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
      <Image src={icon} width={72} height={72} alt={title} />
      <Spacer h={36} />
      <SectionH3>{title}</SectionH3>
      <Spacer h={36} />
      <p className="text-grayMid text-2xl">{copy}</p>
    </div>
  );
}
