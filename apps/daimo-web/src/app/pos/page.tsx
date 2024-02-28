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
const items: POSItem[] = [
  { name: "☕️ Espresso", price: 4 },
  { name: "☕️ Cortado", price: 5 },
  { name: "☕️ Flat White", price: 6 },

  { name: "☕️ Latte", price: 6 },
  { name: "🍵 Matcha Lt.", price: 6 },
  { name: "🦴 Bone Broth", price: 8 },

  { name: "☕️ Filtered/CB", price: 5 },
  { name: "🫖 Tea", price: 5 },
  { name: "💦 Pellegrino", price: 6 },

  { name: "💦 Box Water", price: 5 },
  { name: "🍞 Oatmeal", price: 6 },
  { name: "🍫 Bar", price: 4 },
];

const storeAddress = getAddress("0x8FdA17665A52A98D7c60D1527aDD42f0723B8515");
const tag = "ecd";

export default function CafePOSPage(props: {
  searchParams: { token?: string };
}) {
  const params = new URLSearchParams(props.searchParams);
  const updateToken = params.get("token") || "dev-update-token";

  return (
    <RpcHookProvider>
      <PointOfSalePage {...{ tag, updateToken, items, storeAddress }} />
    </RpcHookProvider>
  );
}
