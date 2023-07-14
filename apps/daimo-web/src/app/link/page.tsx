import Image from "next/image";

import { AppStoreBadge } from "../../components/AppStoreBadge";
import { H1 } from "../../components/typography";

export default function LinkPage() {
  return (
    <main className="max-w-sm mx-auto">
      <center>
        <div className="h-4" />
        <Image src="/logo-blue.png" alt="Daimo" width="200" height="200" />

        <div className="h-6" />
        <div className="flex flex-row gap-4 justify-center">
          <AppStoreBadge platform="ios" />
          <AppStoreBadge platform="android" />
        </div>
        <div className="h-8" />

        <H1>App store coming soon</H1>
        <div className="h-4" />
        <p>
          Till then, message <strong>dcposch</strong> on Telegram
          <br />
          to try the TestFlight.
        </p>
      </center>
    </main>
  );
}
