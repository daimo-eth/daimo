import Image from "next/image";

import { PixelBackground } from "../components/PixelBackground";

export function SectionWhyDaimo() {
  return (
    <section className="bg-white w-full flex">
      <div className="flex flex-col justify-center flex-1 bg-[url('/assets/why-gradient.jpg')] bg-cover bg-no-repeat px-20 py-24">
        <h2 className="font-medium text-[77px] text-[#111111]">Why Daimo?</h2>
        <p className="font-medium text-[24px] text-[#535353]">
          Secure, audited, and fully open source.
          <br />
          The safest, fastest way to stablecoin.
        </p>
        <div className="flex justify-center">
          <Image
            src="/assets/why-daimo-secure.png"
            width={800}
            height={800}
            alt="Why Daimo"
            className="w-[260px] pt-14"
          />
        </div>
      </div>
      <div className="flex flex-col justify-center flex-1 px-20 z-10">
        <h3 className="font-medium text-[48px] text-[#111111]">
          Your keys, your coins.
        </h3>
        <div className="text-[#777] text-[24px] flex flex-col space-y-4 max-w-sm">
          <p>No seed phrase.</p>
          <p>
            Keys live in secure hardware on your phone. Secure passkey backups.
          </p>
          <p>The freedom of self-custody, easier than ever before.</p>
        </div>
        <div className="absolute -z-10">
          <PixelBackground />
        </div>
      </div>
    </section>
  );
}
