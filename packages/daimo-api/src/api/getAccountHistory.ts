import { generateOnRampURL } from "@coinbase/cbpay-js";
import {
  AddrLabel,
  ChainGasConstants,
  DisplayOpEvent,
  EAccount,
  KeyData,
  LinkedAccount,
  RecommendedExchange,
  appStoreLinks,
  assert,
  hasAccountName,
} from "@daimo/common";
import semverLt from "semver/functions/lt";
import { Address } from "viem";

import { ProfileCache } from "./profile";
import { CoinIndexer } from "../contract/coinIndexer";
import { KeyRegistry } from "../contract/keyRegistry";
import { NameRegistry, specialAddrLabels } from "../contract/nameRegistry";
import { Paymaster } from "../contract/paymaster";
import { ViemClient } from "../network/viemClient";
import { getAppVersionTracker } from "../server/appVersion";
import { TrpcRequestContext } from "../server/trpc";
import { Watcher } from "../shovel/watcher";

export interface AccountHistoryResult {
  address: Address;
  sinceBlockNum: number;

  lastFinalizedBlock: number;
  lastBlock: number;
  lastBlockTimestamp: number;
  lastBalance: `${bigint}`;

  chainGasConstants: ChainGasConstants;
  recommendedExchanges: RecommendedExchange[];

  transferLogs: DisplayOpEvent[];
  namedAccounts: EAccount[];
  accountKeys: KeyData[];
  linkedAccounts: LinkedAccount[];
  profilePicture?: string;

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
  ctx: TrpcRequestContext,
  address: Address,
  sinceBlockNum: number,
  watcher: Watcher,
  vc: ViemClient,
  coinIndexer: CoinIndexer,
  profileCache: ProfileCache,
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

  // Get linked accounts
  const linkedAccounts = profileCache.getLinkedAccounts(address);

  // Get pfps from linked accounts
  const profilePicture = profileCache.getProfilePicture(linkedAccounts);

  const ret: AccountHistoryResult = {
    address,
    sinceBlockNum,

    lastFinalizedBlock: Number(finBlock.number),
    lastBlock,
    lastBlockTimestamp,
    lastBalance: `${lastBalance}`,

    chainGasConstants,
    recommendedExchanges,
    suggestedActions: [],

    transferLogs,
    namedAccounts,
    accountKeys,
    linkedAccounts,
    profilePicture,
  };

  // Suggest an action to the user, like backing up their account
  const suggestedActions = getSuggestedActions(eAcc, ret, ctx);

  return { ...ret, suggestedActions };
}

function getSuggestedActions(
  eAcc: EAccount,
  hist: AccountHistoryResult,
  ctx: TrpcRequestContext
) {
  const ret: SuggestedAction[] = [];

  // Not on latest version? Ask them to upgrade.
  const latestVersion = getAppVersionTracker().getLatestVersion();
  const { daimoPlatform, daimoVersion } = ctx;
  const appVersion = daimoVersion.split(" ")[0];
  if (latestVersion == null) {
    console.log(`[API] no latest app version available`);
  } else if (semverLt(appVersion, latestVersion)) {
    ret.push({
      id: `2024-02-update-${appVersion}-to-${latestVersion}`,
      title: "Upgrade Available",
      subtitle: `Tap to update to ${latestVersion}`,
      url: appStoreLinks[daimoPlatform.startsWith("ios") ? "ios" : "android"],
    });
  }

  // If account is not backed up, asked them to create a backup
  if (hist.accountKeys.length === 1) {
    ret.push({
      id: "2024-02-passkey-backup",
      title: "Secure Your Account",
      subtitle: "Keep your account safe with a passkey backup",
      url: `daimo://settings/add-passkey`,
    });
  }

  // Active account: has recieved transfer from another user in "recent"
  // transfer logs. The recency condition means that it will be dismissed
  // automatically if transferLogs are empty (eg, user leaves app open for
  // a while).
  const hasReceived = hist.transferLogs.some((log) => {
    return (
      log.type === "transfer" &&
      log.to === eAcc.addr &&
      specialAddrLabels[log.from] !== AddrLabel.Faucet
    );
  });

  if (hasReceived) {
    ret.push({
      id: "2023-12-join-tg-5",
      icon: "comment-discussion",
      title: "Feedback? Ideas?",
      subtitle: "Join our Telegram group.",
      url: `https://t.me/+to2ghQJfgic0YjA9`,
    });
  }

  return ret;
}

function getRampNetworkURL(account: EAccount) {
  const hostApikey = "kkkkdu9jsw3dbc3qnf8o2bvmzoxkp63mrz27hrma";
  const hostAppName = "Daimo";
  const hostLogoUrl = "https://daimo.com/assets/icon-ramp.png";
  const swapAsset = "BASE_USDC";
  return `https://app.ramp.network?hostApiKey=${hostApikey}&hostAppName=${hostAppName}&hostLogoUrl=${hostLogoUrl}&swapAsset=${swapAsset}&userAddress=${account.addr}`;
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
      title: "Transfer from Ethereum",
      cta: "Bridge from any wallet",
      url: `https://daimo.com/bridge/${account.name}`,
    },
    {
      title: "Send from Coinbase & other options",
      cta: "Deposit from Coinbase",
      url: cbUrl,
    },
    {
      title: "Cards, banks, & international options",
      cta: "Buy USDC",
      url: getRampNetworkURL(account),
    },
  ];
}
