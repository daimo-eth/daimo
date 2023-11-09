import Image from "next/image";

import { Spacer } from "../components/layout";
import { TextH1 } from "../components/typography";

export function SectionWhyDaimo() {
  return (
    <section className="bg-white pt-24 md:bg-ivory md:py-24">
      <div className="m-auto max-w-screen-xl px-8">
        <TextH1>Why Daimo</TextH1>
        <Spacer h={48} />
        <div className="flex gap-16 md:gap-8 xl:gap-16 flex-col items-stretch md:flex-row">
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
    <div className="bg-ivoryDark rounded-lg p-16 md:max-w-md basis-0 flex-1">
      <Image
        src={icon}
        width={72}
        height={72}
        alt={title}
        className="w-20 h-20"
      />
      <Spacer h={36} />
      <TextH1>{title}</TextH1>
      <Spacer h={36} />
      <p className="text-grayMid text-2xl">{copy}</p>
    </div>
  );
}
