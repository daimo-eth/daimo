"use client";

import { RouteData, Squid } from "@0xsquid/sdk";
import { TokenBalance } from "@daimo/api";
import { EAccount, assert } from "@daimo/common";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Signer, providers } from "ethers";
import Image from "next/image";
import {
  ChangeEvent,
  FocusEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { WalletClient, formatUnits, getAddress, parseUnits } from "viem";
import { Address, useAccount, useWalletClient } from "wagmi";

import { AccountBubble } from "../../components/AccountBubble";
import { Providers, chainsBridge } from "../../components/Providers";
import {
  TextBold,
  TextError,
  TextH1,
  TextH3Subtle,
  TextLight,
} from "../../components/typography";
import { chainConfig } from "../../env";
import { RpcHookProvider, rpcHook, trpc } from "../../utils/trpc";

let initSquid: Promise<Squid> | null = null;

async function getSquid() {
  if (initSquid) return initSquid;

  // instantiate the SDK
  const squid = new Squid();
  squid.setConfig({
    baseUrl: "https://api.squidrouter.com",
    integratorId: "daimo-sdk",
  });

  // init the SDK
  console.log("[BRIDGE] initializing Squid");
  initSquid = squid.init().then(() => squid);
  return initSquid;
}

export default function BridgePage() {
  return (
    <Providers chains={chainsBridge}>
      <BridgePageInner />
    </Providers>
  );
}

function BridgePageInner() {
  const account = useAccount();

  useEffect(() => {
    getSquid();
  }, []);

  return (
    <RpcHookProvider>
      <main className="max-w-md m-auto py-8">
        <TextH1>Bridge to Daimo</TextH1>
        <div className="h-8" />
        <TextH3Subtle>FROM</TextH3Subtle>
        <div className="h-4" />
        <ConnectButton showBalance={false} />
        {account.address && <div className="h-4" />}
        {account.address && <BalancesSection addr={account.address} />}
      </main>
    </RpcHookProvider>
  );
}

function BalancesSection({ addr }: { addr: Address }) {
  const result = rpcHook.trpc.bridgeGetAvailableAssets.useQuery({ addr });

  return (
    <>
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
      {sel && <BridgeSection fromBal={sel} />}
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
        (sel ? "border-primary bg-ivory" : "border-white")
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

function BridgeSection({ fromBal }: { fromBal: TokenBalance }) {
  const [amount, setAmount] = useState<string>("");

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val.match(/^\d*\.?\d*$/)) setAmount(val);
    },
    [setAmount]
  );

  const onBlur = useCallback((e: FocusEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAmount(Number(val).toFixed(2));
  }, []);

  const amountUnits = parseUnits(amount, fromBal.tokenDecimals);

  return (
    <>
      <TextH3Subtle>AMOUNT</TextH3Subtle>
      <div className="h-4" />
      <div className="flex flex-row justify-stretch">
        <input
          className="rounded-md text-3xl font-semibold text-right text-midnight tabular-nums bg-ivory flex-grow px-8 py-4 outline-none border border-white active:border-primary focus:border-primary"
          placeholder="0.00"
          value={amount}
          onChange={onChange}
          onBlur={onBlur}
        />
      </div>
      <div className="h-8" />
      <BridgeExecSection fromBal={fromBal!} amount={`${amountUnits}`} />
    </>
  );
}

function BridgeExecSection({
  fromBal,
  amount,
}: {
  fromBal: TokenBalance;
  amount: `${bigint}`;
}) {
  const [route, setRoute] = useState<RouteData>();

  const toAddr = getAddress(window.location.hash.slice(1));

  // Load recipient
  const eAccResult = rpcHook.trpc.getEthereumAccount.useQuery({ addr: toAddr });

  // Load route
  useEffect(() => {
    setRoute(undefined);
    (async () => {
      const params = {
        fromChain: fromBal.chainID,
        fromToken: fromBal.tokenAddr,
        fromAddress: fromBal.ownerAddr,
        fromAmount: amount,
        toChain: chainConfig.chainL2.id, // Base
        toToken: chainConfig.tokenAddress, // USDC
        toAddress: toAddr,
        slippage: 1.0, // 1.00 = 1% max slippage across the entire route
        enableForecall: true, // instant execution service, defaults to true
        quoteOnly: false, // optional, defaults to false
      };

      const squid = await getSquid();

      console.log(`[BRIDGE] getting route ${JSON.stringify(params)}...`);
      const { route, requestId } = await squid.getRoute(params);

      console.log(`[BRIDGE] got route ${requestId} ${JSON.stringify(route)}`);
      setRoute(route);
    })();
  }, [fromBal, amount, toAddr]);

  const { data: walletClient } = useWalletClient();

  const signer = useMemo(
    () => walletClient && walletClientToSigner(walletClient),
    [walletClient]
  );

  const execDisabled = !route;
  const execLabel = route ? "BRIDGE TO BASE" : "LOADING...";
  const exec = async () => {
    if (!route) return;
    if (!signer) return;

    console.log(
      `[BRIDGE] executing route ${JSON.stringify(route.estimate)}...`
    );
    const squid = await getSquid();

    const executionSettings = { infiniteApproval: false };
    const tx = await squid.executeRoute({ signer, route, executionSettings });
    console.log(`[BRIDGE] executed transaction`);

    const txReceipt = await (tx as any).wait();
    console.log(`[BRIDGE] confirmed transaction ${JSON.stringify(txReceipt)}`);
  };

  return (
    <>
      <TextH3Subtle>TO DAIMO</TextH3Subtle>
      <div className="h-4" />
      {route && eAccResult.data && (
        <RouteSummary route={route} toAccount={eAccResult.data} />
      )}
      <div className="h-8" />
      <div className="flex">
        <button
          className="bg-primary font-semibold p-4 text-center text-sm text-white tracking-wider rounded-md flex-grow"
          onClick={exec}
          disabled={execDisabled}
        >
          {execLabel}
        </button>
      </div>
    </>
  );
}

function RouteSummary({
  route,
  toAccount,
}: {
  route: RouteData;
  toAccount: EAccount;
}) {
  assert(route.params.toAddress === toAccount.addr, "addr mismatch");
  assert(toAccount.name !== null, "destination not a Daimo account");

  const timeS = route.estimate.estimatedRouteDuration;
  const amount = (Number(route.estimate.toAmount) / 1e6).toFixed(2);

  return (
    <div>
      <div className="flex justify-between items-center pl-2 pr-8 py-4">
        <div className="flex items-center">
          <AccountBubble name={toAccount.name} />
          <div className="w-4" />
          <div className="text-midnight font-semibold text-xl leading-none">
            {toAccount.name}
          </div>
        </div>
        <div className="text-2xl text-midnight font-semibold text-right">
          ${amount} <span className="text-xl">USDC</span>
        </div>
      </div>
      <div className="flex justify-between pl-4 pr-8">
        <div>
          {route.estimate.feeCosts
            .filter((fee) => Number(fee.amountUSD) > 0)
            .map((fee) => (
              <TextBold key={fee.name}>
                {fee.name}: ${Number(fee.amountUSD).toFixed(2)}
              </TextBold>
            ))}
        </div>
        <div>
          <TextBold>Estimated time: {timeS}s</TextBold>
        </div>
      </div>
    </div>
  );
}

function walletClientToSigner(walletClient: WalletClient): Signer {
  const { account, chain, transport } = walletClient;
  const network = {
    chainId: chain!.id,
    name: chain!.name,
    ensAddress: chain!.contracts?.ensRegistry?.address,
  };
  const provider = new providers.Web3Provider(transport, network);
  const signer = provider.getSigner(account!.address);
  return signer;
}
