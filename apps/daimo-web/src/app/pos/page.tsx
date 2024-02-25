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
  { name: "☕️ Espresso", price: 4 },
  { name: "☕️ Latte", price: 6 },

  { name: "🍵 Matcha Latte", price: 6 },
  { name: "🦴 Bone Broth", price: 8 },

  { name: "☕️ Cold Brew", price: 5 },
  { name: "🫖 Hot Tea", price: 5 },

  { name: "💦 Pellegrino", price: 6 },
  { name: "🍞 Oatmeal", price: 6 },
  { name: "🍜 Ramen", price: 6 },
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
