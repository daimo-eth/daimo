import { generateOnRampURL } from "@coinbase/cbpay-js";
import {
  ChainGasConstants,
  EAccount,
  KeyData,
  RecommendedExchange,
  TransferOpEvent,
  assert,
  hasAccountName,
} from "@daimo/common";
import { Address } from "viem";

import { CoinIndexer } from "../contract/coinIndexer";
import { KeyRegistry } from "../contract/keyRegistry";
import { NameRegistry } from "../contract/nameRegistry";
import { Paymaster } from "../contract/paymaster";
import { ViemClient } from "../contract/viemClient";

export interface AccountHistoryResult {
  address: Address;
  sinceBlockNum: number;

  lastFinalizedBlock: number;
  lastBlock: number;
  lastBlockTimestamp: number;
  lastBalance: `${bigint}`;

  chainGasConstants: ChainGasConstants;
  recommendedExchanges: RecommendedExchange[];

  transferLogs: TransferOpEvent[];
  namedAccounts: EAccount[];
  accountKeys: KeyData[];
}

/**
 * Serves everything new that happened to an account since block n.
 *
 * This RPC is the primary way the app stays synced to the chain.
 */
export async function getAccountHistory(
  address: Address,
  sinceBlockNum: number,
  vc: ViemClient,
  coinIndexer: CoinIndexer,
  nameReg: NameRegistry,
  keyReg: KeyRegistry,
  paymaster: Paymaster
): Promise<AccountHistoryResult> {
  console.log(`[API] getAccountHist: ${address} since ${sinceBlockNum}`);
  const eAcc = await nameReg.getEAccount(address);
  assert(eAcc.name != null, "Not a Daimo account");

  // Get latest finalized block. Next account sync, fetch since this block.
  const finBlock = await vc.publicClient.getBlock({
    blockTag: "finalized",
  });
  if (finBlock.number == null) throw new Error("No finalized block");
  if (finBlock.number < sinceBlockNum) {
    console.log(
      `[API] getAccountHist: OLD final block ${finBlock.number} < ${sinceBlockNum}`
    );
  }

  // Get the latest block + current balance.
  const lastBlk = vc.getLastBlock();
  if (lastBlk == null) throw new Error("No latest block");
  const lastBlock = Number(lastBlk.number);
  const lastBlockTimestamp = Number(lastBlk.timestamp);
  const lastBalance = await coinIndexer.getBalanceAt(address, lastBlock);

  // TODO: get userops, including reverted ones. Show failed sends.

  // Get successful transfers since sinceBlockNum
  const transferLogs = coinIndexer.filterTransfers({
    addr: address,
    sinceBlockNum: BigInt(sinceBlockNum),
  });

  console.log(
    `[API] getAccountHist: ${transferLogs.length} logs for ${address} since ${sinceBlockNum}`
  );

  // Get named accounts
  const addrs = new Set<Address>();
  transferLogs.forEach((log) => {
    addrs.add(log.from);
    addrs.add(log.to);
  });
  const namedAccounts = (
    await Promise.all([...addrs].map((addr) => nameReg.getEAccount(addr)))
  ).filter((acc) => hasAccountName(acc));

  // Get account keys
  const accountKeys = await keyReg.resolveAddressKeys(address);
  assert(accountKeys != null);

  // Prefetch info required to send operations > fast at time of sending.
  const chainGasConstants = await paymaster.calculateChainGasConstants();

  // Prefetch info required to deposit to your Daimo account.
  const recommendedExchanges = fetchRecommendedExchanges(eAcc);

  return {
    address,
    sinceBlockNum,

    lastFinalizedBlock: Number(finBlock.number),
    lastBlock,
    lastBlockTimestamp,
    lastBalance: `${lastBalance}`,

    chainGasConstants,
    recommendedExchanges,

    transferLogs,
    namedAccounts,
    accountKeys,
  };
}

function fetchRecommendedExchanges(account: EAccount): RecommendedExchange[] {
  const cbUrl = generateOnRampURL({
    appId: "2be3ccd9-6ee4-4dba-aba8-d4b458fe476d",
    destinationWallets: [
      {
        address: account.addr,
        blockchains: ["base"],
        assets: ["USDC"],
        supportedNetworks: ["base"],
      },
    ],
    handlingRequestedUrls: true,
    defaultExperience: "send",
  });
  return [
    {
      cta: "Bridge from any wallet",
      url: `https://daimo.com/bridge/${account.name}`,
    },
    { cta: "Deposit from Coinbase", url: cbUrl },
  ];
}
