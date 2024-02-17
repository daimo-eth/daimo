import "@farcaster/auth-kit/styles.css";

import Image from "next/image";

import { ConnectFarcasterBox } from "../../../components/ConnectFarcasterBox";

export default function ConnectFarcasterPage() {
  return (
    <main className="max-w-md mx-auto px-4">
      <center>
        <div className="h-16" />
        <Image src="/logo-web.png" alt="Daimo" width="96" height="96" />
        <div className="h-12" />
        <ConnectFarcasterBox />
      </center>
    </main>
  );
}
