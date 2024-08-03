import { Metadata } from "next";
import { getAddress } from "viem";

import { PointOfSalePage } from "./PointOfSalePage";
import { RpcHookProvider } from "../../utils/rpcHook";

import { useI18N } from "../../i18n/context";

export async function generateMetadata(): Promise<Metadata> {
  const i18n = useI18N();
  const i18 = i18n.pos;
  return {
    title: i18.title(),
    description: i18.description(),
    icons: {
      icon: "/logo-web-favicon.png",
    },
  };
}

const storeAddress = getAddress("0x29A2Aa538F3b0E53B006ebCF6E616DeFBa216195");
const tag = "ecc";

export default function CafePOSPage(props: {
  searchParams: { token?: string };
}) {
  const params = new URLSearchParams(props.searchParams);
  const updateToken = params.get("token") || "dev-update-token";

  return (
    <RpcHookProvider>
      <PointOfSalePage {...{ tag, updateToken, storeAddress }} />
    </RpcHookProvider>
  );
}
