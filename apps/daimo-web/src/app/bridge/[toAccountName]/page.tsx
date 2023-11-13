import { Metadata } from "next";

import { RpcHookProvider } from "../../../utils/rpcHook";
import { BridgePageClient } from "../BridgePageClient";

type LinkProps = {
  params: { toAccountName: string };
};

export async function generateMetadata(props: LinkProps): Promise<Metadata> {
  return {
    title: "li.fi → Daimo Bridge",
    description:
      "Bridge from any wallet to Daimo account: " + props.params.toAccountName,
    icons: {
      icon: "/logo-web-favicon.png",
    },
  };
}

export default function BridgePage({ params }: LinkProps) {
  return (
    <RpcHookProvider>
      <BridgePageClient name={params.toAccountName} />
    </RpcHookProvider>
  );
}
