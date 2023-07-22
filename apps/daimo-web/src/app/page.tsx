import Image from "next/image";

import { H1, H2 } from "../components/typography";

export default function HomePage() {
  return (
    <center>
      <div className="h-16" />
      <Image src="/logo-web.png" alt="Daimo" width="128" height="128" />
      <div className="h-12" />
      <H1>Daimo</H1>
      <div className="h-2" />
      <H2>USDC payments on Ethereum</H2>
      <div className="h-2" />
      <p>
        Fast, permissionless, and global. Your keys, your coins.{" "}
        <a className="font-bold" href="https://github.com/daimo-eth/daimo">
          Learn more on our Github.
        </a>{" "}
      </p>
    </center>
  );
}
