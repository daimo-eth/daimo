import { Metadata } from "next";
import { getAddress } from "viem";

import { PointOfSalePage } from "./PointOfSalePage";
import { RpcHookProvider } from "../../utils/rpcHook";

import { i18n } from "../../i18n";
const i18 = i18n.pos;

export async function generateMetadata(): Promise<Metadata> {
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
