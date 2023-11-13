"use client";

import { assert } from "@daimo/common";
import dynamic from "next/dynamic";

import { TextError, TextLight } from "../../components/typography";
import { chainConfig } from "../../env";
import { rpcHook } from "../../utils/rpcHook";

const LiFiWidgetNext = dynamic(
  () => import("./Widget").then((module) => module.Widget),
  {
    ssr: false,
    loading: () => <TextLight>Loading bridge...</TextLight>,
  }
);

export function BridgePageClient({ name }: { name: string }) {
  assert(name.length > 0);
  const res = rpcHook.trpc.resolveName.useQuery({ name });

  const isTestnet = chainConfig.chainL2.testnet;

  return (
    <main className="max-w-md mx-auto py-8 flex flex-col items-center">
      {isTestnet && <TextError>Configure mainnet to use the bridge.</TextError>}
      {res.isError && <TextError>{res.error.message}</TextError>}
      {res.isLoading && <TextLight>Loading address...</TextLight>}
      {res.isSuccess && !res.data && (
        <TextError>Account {name} not found</TextError>
      )}
      {res.isSuccess && res.data && (
        <LiFiWidgetNext toName={name} toAddress={res.data} />
      )}
    </main>
  );
}
