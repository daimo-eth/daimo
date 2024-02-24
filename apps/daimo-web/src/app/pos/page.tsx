import { Metadata } from "next";
import { getAddress } from "viem";

import { POSItem, PointOfSalePage } from "./PointOfSalePage";
import { RpcHookProvider } from "../../utils/rpcHook";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Daimo Point-Of-Sale",
    description: "One-tap USDC checkout.",
    icons: {
      icon: "/logo-web-favicon.png",
    },
  };
}

// This is an experiment.
// Hard-code for now, can productize if successful.
const title = "✳️ Daimo × Edge City Cafe";

const items: POSItem[] = [
  { name: "🍵 Tea", price: 5 },
  { name: "☕️ Cappucino", price: 5 },
  { name: "❄️ Iced Coffee", price: 4 },
  { name: "🧋 Iced Latte", price: 5 },
  { name: "☕️ Latte", price: 5 },
  { name: "🍗 Broth", price: 6 },
];

const storeAddress = getAddress("0xFBfa6A0D1F44b60d7CCA4b95d5a2CfB15246DB0D");
const tag = "ecd";

export default function CafePOSPage(props: {
  searchParams: { token?: string };
}) {
  const params = new URLSearchParams(props.searchParams);
  const updateToken = params.get("token") || "dev-update-token";

  return (
    <RpcHookProvider>
      <PointOfSalePage {...{ tag, updateToken, title, items, storeAddress }} />
    </RpcHookProvider>
  );
}
