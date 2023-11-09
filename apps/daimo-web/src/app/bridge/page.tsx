"use client";

import { TokenBalance } from "@daimo/api";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { formatUnits } from "viem";
import { Address, useAccount } from "wagmi";

import {
  TextH1,
  TextBold,
  TextError,
  TextH3Subtle,
  TextLight,
} from "../../components/typography";
import { RpcHookProvider, rpcHook } from "../../utils/trpc";

export default function BridgePage() {
  const account = useAccount();

  return (
    <RpcHookProvider>
      <main className="max-w-md m-auto py-8">
        <TextH1>Bridge to Daimo</TextH1>
        <div className="h-4" />
        <ConnectButton />
        {account.address && <div className="h-8" />}
        {account.address && <BalancesSection addr={account.address} />}
      </main>
    </RpcHookProvider>
  );
}

function BalancesSection({ addr }: { addr: Address }) {
  const result = rpcHook.trpc.bridgeGetAvailableAssets.useQuery({ addr });

  return (
    <>
      <TextH3Subtle>FROM</TextH3Subtle>
      <div className="h-4" />
      {result.isLoading && <TextBold>Loading...</TextBold>}
      {result.error && <TextError>{result.error.message}</TextError>}
      {result.data && <BalancesList balances={result.data} />}
    </>
  );
}

function BalancesList({ balances }: { balances: TokenBalance[] }) {
  const [sel, setSel] = useState<TokenBalance>();

  useEffect(() => {
    if (sel && !balances.includes(sel)) setSel(undefined);
  }, [sel, balances]);

  if (balances.length === 0) {
    return (
      <TextLight>Couldn&apos;t find any USDC, USDT or DAI balances.</TextLight>
    );
  }

  return (
    <>
      <ul className="flex flex-col">
        {balances
          .filter((bal) => BigInt(bal.balance) > 0n)
          .map((bal) => (
            <BalanceRow
              {...{ bal }}
              key={bal.chainNetwork + bal.tokenAddr}
              sel={sel === bal}
              onSel={() => setSel(sel === bal ? undefined : bal)}
            />
          ))}
      </ul>
      <div className="h-8" />
      <BridgeSection fromBal={sel} />
    </>
  );
}

function BalanceRow({
  bal,
  sel,
  onSel,
}: {
  bal: TokenBalance;
  sel: boolean;
  onSel: () => void;
}) {
  const amountExact = formatUnits(BigInt(bal.balance), bal.tokenDecimals);
  const amountRounded = Number(amountExact).toFixed(2);

  return (
    <li
      className={
        "flex justify-between items-center cursor-pointer p-2 rounded-md hover:bg-ivory border " +
        (sel ? "border-primary" : "border-white")
      }
      onClick={onSel}
    >
      <div className="flex items-center">
        <Image
          src={`/assets/tokens/${bal.tokenSymbol}.png`}
          className="w-6 h-6 rounded-full"
          width={24}
          height={24}
          alt={bal.tokenSymbol}
        />
        <div className="w-2" />
        <div className="font-semibold text-midnight">
          {bal.tokenSymbol} on {bal.chainName}
        </div>
      </div>
      <div>
        <div className="font-semibold text-grayMid">
          ${amountRounded} available
        </div>
      </div>
    </li>
  );
}

function BridgeSection({ fromBal }: { fromBal?: TokenBalance }) {
  const [amount, setAmount] = useState<string>("");

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val.match(/^\d*\.?\d*$/)) setAmount(val);
    },
    [setAmount]
  );

  return (
    <>
      <div className="flex flex-row justify-stretch">
        <input
          className="rounded-md text-xl font-semibold text-right text-midnight tabular-nums bg-ivory flex-grow px-4 py-2 outline-none border border-white active:border-primary focus:border-primary"
          value={amount}
          onChange={onChange}
        />
      </div>
      <div className="h-8" />
      <TextH3Subtle>TO</TextH3Subtle>
      <div className="h-4" />
      <TextBold>TODO</TextBold>
    </>
  );
}
