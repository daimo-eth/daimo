import { generateOnRampURL } from "@coinbase/cbpay-js";
import {
  ChainGasConstants,
  DisplayOpEvent,
  EAccount,
  KeyData,
  RecommendedExchange,
  assert,
  hasAccountName,
} from "@daimo/common";
import { Address, hexToBytes } from "viem";

import { CoinIndexer } from "../contract/coinIndexer";
import { KeyRegistry } from "../contract/keyRegistry";
import { NameRegistry } from "../contract/nameRegistry";
import { NoteIndexer } from "../contract/noteIndexer";
import { Paymaster } from "../contract/paymaster";
import { ViemClient } from "../network/viemClient";
import { Watcher } from "../shovel/watcher";

export interface AccountHistoryResult {
  address: Address;
  sinceBlockNum: number;

  lastFinalizedBlock: number;
  lastBlock: number;
  lastBlockTimestamp: number;
  lastBalance: `${bigint}`;
  nextNoteSeq: number;

  chainGasConstants: ChainGasConstants;
  recommendedExchanges: RecommendedExchange[];

  transferLogs: DisplayOpEvent[];
  namedAccounts: EAccount[];
  accountKeys: KeyData[];

  suggestedActions: SuggestedAction[];
}

export interface SuggestedAction {
  id: string;
  icon?: string;
  title: string;
  subtitle: string;
  url: string;
}

/**
 * Serves everything new that happened to an account since block n.
 *
 * This RPC is the primary way the app stays synced to the chain.
 */
export async function getAccountHistory(
  address: Address,
  sinceBlockNum: number,
  watcher: Watcher,
  vc: ViemClient,
  coinIndexer: CoinIndexer,
  noteIndexer: NoteIndexer,
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
  const lastBlk = watcher.latestBlock();
  if (lastBlk == null) throw new Error("No latest block");
  const lastBlock = Number(lastBlk.number);
  const lastBlockTimestamp = lastBlk.timestamp;
  const lastBalance = await coinIndexer.getBalanceAt(address, lastBlock);

  const nextNoteSeq = noteIndexer.getNextSeq(address);

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
    if (log.type === "claimLink" || log.type === "createLink") {
      if (log.noteStatus.claimer) addrs.add(log.noteStatus.claimer.addr);
      addrs.add(log.noteStatus.sender.addr);
    }
  });
  const namedAccounts = (
    await Promise.all([...addrs].map((addr) => nameReg.getEAccount(addr)))
  ).filter((acc) => hasAccountName(acc));

  // Get account keys
  const accountKeys = await keyReg.resolveAddressKeys(address);
  assert(accountKeys != null);

  // Prefetch info required to send operations > fast at time of sending.
  const chainGasConstants = await paymaster.calculateChainGasConstants(eAcc);

  // Prefetch info required to deposit to your Daimo account.
  const recommendedExchanges = fetchRecommendedExchanges(eAcc);

  const ret: AccountHistoryResult = {
    address,
    sinceBlockNum,

    lastFinalizedBlock: Number(finBlock.number),
    lastBlock,
    lastBlockTimestamp,
    lastBalance: `${lastBalance}`,
    nextNoteSeq,

    chainGasConstants,
    recommendedExchanges,
    suggestedActions: [],

    transferLogs,
    namedAccounts,
    accountKeys,
  };

  // Suggest an action to the user, like backing up their account
  const suggestedActions = getSuggestedActions(eAcc, ret);

  return { ...ret, suggestedActions };
}

function getSuggestedActions(eAcc: EAccount, hist: AccountHistoryResult) {
  const ret: SuggestedAction[] = [];

  if (hist.accountKeys.length === 1) {
    if (hist.lastBalance !== "0" || hexToBytes(eAcc.addr)[0] < 0x80) {
      // A/B test: half of accounts asked to "Secure your account" immediately.
      // Other half are asked only once they have a balance.
      ret.push({
        id: "passkey-backup-new-account",
        title: "Secure your account",
        subtitle: "Keep your account safe with a passkey backup",
        url: `daimo://settings/add-passkey`,
      });
    }
  }

  // Active accounts: ask them to join our TG
  ret.push({
    id: "2023-12-join-tg-5",
    icon: "comment-discussion",
    title: "Feedback? Ideas?",
    subtitle: "Join our Telegram group.",
    url: `https://t.me/+to2ghQJfgic0YjA9`,
  });

  return ret;
}

function fetchRecommendedExchanges(account: EAccount): RecommendedExchange[] {
  const cbUrl = generateOnRampURL({
    appId: "2be3ccd9-6ee4-4dba-aba8-d4b458fe476d",
    destinationWallets: [
      {
        address: account.addr,
        assets: ["USDC"],
        supportedNetworks: ["base"],
      },
    ],
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
