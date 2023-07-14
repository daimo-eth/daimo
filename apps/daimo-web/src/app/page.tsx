import Image from "next/image";

import { H1, H2 } from "../components/typography";

export default function HomePage() {
  return (
    <main>
      <center>
        <div className="h-4" />
        <Image src="/logo-web.png" alt="Daimo" width="200" height="200" />
        <div className="h-4" />
        <H1>Daimo</H1>
        <div className="h-2" />
        <H2>Coming soon</H2>
      </center>
    </main>
  );
}
