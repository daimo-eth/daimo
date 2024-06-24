import { generateOnRampURL } from "@coinbase/cbpay-js";
import {
  AddrLabel,
  ChainGasConstants,
  CurrencyExchangeRate,
  DaimoInviteCodeStatus,
  DaimoRequestV2Status,
  DisplayOpEvent,
  EAccount,
  KeyData,
  LinkedAccount,
  ProposedSwap,
  RecommendedExchange,
  SuggestedAction,
  appStoreLinks,
  assert,
  daimoDomainAddress,
  formatDaimoLink,
  hasAccountName,
} from "@daimo/common";
import semverLt from "semver/functions/lt";
import { Address } from "viem";

import { getExchangeRates } from "./getExchangeRates";
import { getLinkStatus } from "./getLinkStatus";
import { ProfileCache } from "./profile";
import { ETHIndexer } from "../contract/ethIndexer";
import { ForeignCoinIndexer } from "../contract/foreignCoinIndexer";
import { HomeCoinIndexer } from "../contract/homeCoinIndexer";
import { KeyRegistry } from "../contract/keyRegistry";
import { NameRegistry, specialAddrLabels } from "../contract/nameRegistry";
import { NoteIndexer } from "../contract/noteIndexer";
import { Paymaster } from "../contract/paymaster";
import { RequestIndexer } from "../contract/requestIndexer";
import { DB } from "../db/db";
import { ExternalApiCache } from "../db/externalApiCache";
import { getEnvApi } from "../env";
import {
  LandlineAccount,
  getLandlineAccounts,
  getLandlineSession,
} from "../landline/connector";
import { ViemClient } from "../network/viemClient";
import { InviteCodeTracker } from "../offchain/inviteCodeTracker";
import { InviteGraph } from "../offchain/inviteGraph";
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
  inviteLinkStatus: DaimoInviteCodeStatus | null;
  invitees: EAccount[];
  notificationRequestStatuses: DaimoRequestV2Status[];
  proposedSwaps: ProposedSwap[];

  exchangeRates: CurrencyExchangeRate[];

  landlineSessionKey: string;
  landlineAccounts: LandlineAccount[];
}

/**
 * Serves everything new that happened to an account since block n.
 *
 * This RPC is the primary way the app stays synced to the chain.
 */
export async function getAccountHistory(
  ctx: TrpcRequestContext,
  address: Address,
  inviteCode: string | undefined,
  sinceBlockNum: number,
  watcher: Watcher,
  vc: ViemClient,
  homeCoinIndexer: HomeCoinIndexer,
  ethIndexer: ETHIndexer,
  foreignCoinIndexer: ForeignCoinIndexer,
  profileCache: ProfileCache,
  noteIndexer: NoteIndexer,
  requestIndexer: RequestIndexer,
  inviteCodeTracker: InviteCodeTracker,
  inviteGraph: InviteGraph,
  nameReg: NameRegistry,
  keyReg: KeyRegistry,
  paymaster: Paymaster,
  db: DB,
  extApiCache: ExternalApiCache
): Promise<AccountHistoryResult> {
  const eAcc = nameReg.getDaimoAccount(address);
  assert(eAcc != null && eAcc.name != null, "Not a Daimo account");
  const startMs = Date.now();
  const log = `[API] start getAccountHist: ${eAcc.name} ${address} since ${sinceBlockNum}`;
  console.log(log);

  // Get latest finalized block. Next account sync, fetch since this block.
  const finBlock = await vc.publicClient.getBlock({
    blockTag: "finalized",
  });
  if (finBlock.number == null) throw new Error("No finalized block");
  if (finBlock.number < sinceBlockNum) {
    console.log(`${log}: sinceBlockNum > finalized block ${finBlock.number}`);
  }

  // Get the latest block + current balance.
  const lastBlk = watcher.latestBlock();
  if (lastBlk == null) throw new Error("No latest block");
  assert(
    lastBlk.number >= finBlock.number,
    `Latest block ${lastBlk.number} < finalized ${finBlock.number}`
  );
  const lastBlock = Number(lastBlk.number);
  const lastBlockTimestamp = lastBlk.timestamp;
  const lastBalance = homeCoinIndexer.getCurrentBalance(address);

  // TODO: get userops, including reverted ones. Show failed sends.

  // Get successful transfers since sinceBlockNum
  const transferLogs = homeCoinIndexer.filterTransfers({
    addr: address,
    sinceBlockNum: BigInt(sinceBlockNum),
  });
  let elapsedMs = Date.now() - startMs;
  console.log(`${log}: ${elapsedMs}ms ${transferLogs.length} logs`);

  // Get named accounts
  const addrs = new Set<Address>();
  transferLogs.forEach((log) => {
    addrs.add(log.from);
    addrs.add(log.to);
    if (log.type === "claimLink" || log.type === "createLink") {
      if (log.noteStatus.claimer) addrs.add(log.noteStatus.claimer.addr);
      addrs.add(log.noteStatus.sender.addr);
    } else if (log.type === "transfer" && log.preSwapTransfer) {
      addrs.add(log.preSwapTransfer.from);
    }
  });
  const namedAccounts = (
    await Promise.all([...addrs].map((addr) => nameReg.getEAccount(addr)))
  ).filter((acc) => hasAccountName(acc));

  // Get account keys
  const accountKeys = keyReg.resolveAddressKeys(address);
  assert(accountKeys != null);

  // Prefetch info required to send operations > fast at time of sending.
  const chainGasConstants = await paymaster.calculateChainGasConstants(eAcc);

  // Prefetch info required to deposit to your Daimo account.
  const recommendedExchanges = fetchRecommendedExchanges(eAcc);

  // Get linked accounts
  const linkedAccounts = profileCache.getLinkedAccounts(address);
  const inviteLinkStatus = inviteCode
    ? ((await getLinkStatus(
        formatDaimoLink({ type: "invite", code: inviteCode }),
        nameReg,
        noteIndexer,
        requestIndexer,
        inviteCodeTracker,
        db
      )) as DaimoInviteCodeStatus)
    : null;

  const inviteeAddrs = inviteGraph.getInvitees(address);
  const invitees = inviteeAddrs
    .map((addr) => nameReg.getDaimoAccount(addr))
    .filter((acc) => acc != null) as EAccount[];
  elapsedMs = Date.now() - startMs;
  console.log(`${log}: ${elapsedMs}ms: ${invitees.length} invitees`);

  // Get pfps from linked accounts
  const profilePicture = profileCache.getProfilePicture(address);

  // Get request data for this user
  const notificationRequestStatuses = requestIndexer.getAddrRequests(address);

  // Get proposed swaps of non-home coin tokens for address
  const proposedSwaps = [
    // TODO: re-enable once eth_transfers is caught up
    // ...(await ethIndexer.getProposedSwapsForAddr(address, true)),
    ...(await foreignCoinIndexer.getProposedSwapsForAddr(address)),
  ];
  elapsedMs = Date.now() - startMs;
  console.log(`${log}: ${elapsedMs}: ${proposedSwaps.length} swaps`);

  // Get exchange rates
  const exchangeRates = await getExchangeRates(extApiCache);

  // Get landline session key and accounts
  let landlineSessionKey = "";
  let landlineAccounts: LandlineAccount[] = [];

  const username = eAcc.name;
  const isUserWhitelisted =
    getEnvApi().LANDLINE_WHITELIST_USERNAMES.includes(username);
  if (getEnvApi().LANDLINE_API_URL && isUserWhitelisted) {
    landlineSessionKey = await getLandlineSession(address);
    landlineAccounts = await getLandlineAccounts(address);
  }

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
    inviteLinkStatus,
    invitees,
    notificationRequestStatuses,
    proposedSwaps,
    exchangeRates,

    landlineSessionKey,
    landlineAccounts,
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
  if (appVersion && latestVersion && semverLt(appVersion, latestVersion)) {
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
  const finalUrl = "https://daimo.com/l/deposit";
  return `https://app.ramp.network?hostApiKey=${hostApikey}&hostAppName=${hostAppName}&hostLogoUrl=${hostLogoUrl}&swapAsset=${swapAsset}&userAddress=${account.addr}&finalUrl=${finalUrl}`;
}

function getBridgeURL(account: EAccount) {
  return `https://www.relay.link/daimo?toChainId=8453&toCurrency=0x833589fcd6edb6e08f4c7c32d4f71b54bda02913&lockToToken=true&toAddress=${account.addr}`;
}

function getCoinbaseURL(account: EAccount) {
  return generateOnRampURL({
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
}

function fetchRecommendedExchanges(account: EAccount): RecommendedExchange[] {
  return [
    {
      title: "Transfer from another chain",
      cta: "Bridge USDC from any wallet",
      url: getBridgeURL(account),
      logo: `${daimoDomainAddress}/assets/deposit/ethereum.png`,
      sortId: 0,
    },
    {
      title: "Send from Coinbase & other options",
      cta: "Deposit from Coinbase",
      url: getCoinbaseURL(account),
      logo: `${daimoDomainAddress}/assets/deposit/coinbase.png`,
      sortId: 1,
    },
    // 2 is Binance, loaded client-side on demand.
    {
      title: "Cards, banks, & international options",
      cta: "Buy USDC",
      url: getRampNetworkURL(account),
      logo: `${daimoDomainAddress}/assets/deposit/usdc.png`,
      sortId: 3,
    },
  ];
}
