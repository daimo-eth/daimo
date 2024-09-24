import { generateOnRampURL } from "@coinbase/cbpay-js";
import {
  ChainGasConstants,
  CurrencyExchangeRate,
  DaimoInviteCodeStatus,
  DaimoRequestV2Status,
  EAccount,
  KeyData,
  LandlineAccount,
  LinkedAccount,
  ProposedSwap,
  RecommendedExchange,
  SuggestedAction,
  TransferClog,
  appStoreLinks,
  assert,
  assertNotNull,
  daimoDomainAddress,
  formatDaimoLink,
  getLandlineAccountName,
  guessTimestampFromNum,
  hasAccountName,
} from "@daimo/common";
import semver from "semver";
import semverLt from "semver/functions/lt";
import { Address } from "viem";

import { FeatFlag } from "./featureFlag";
import { getExchangeRates } from "./getExchangeRates";
import { getLinkStatus } from "./getLinkStatus";
import { ProfileCache } from "./profile";
import { ForeignCoinIndexer } from "../contract/foreignCoinIndexer";
import { HomeCoinIndexer } from "../contract/homeCoinIndexer";
import { KeyRegistry } from "../contract/keyRegistry";
import { NameRegistry } from "../contract/nameRegistry";
import { NoteIndexer } from "../contract/noteIndexer";
import { Paymaster } from "../contract/paymaster";
import { RequestIndexer } from "../contract/requestIndexer";
import { DB } from "../db/db";
import { ExternalApiCache } from "../db/externalApiCache";
import { chainConfig, getEnvApi } from "../env";
import { i18n } from "../i18n";
import {
  getLandlineAccounts,
  getLandlineSession,
  getLandlineTransfers,
  getLandlineURL,
} from "../landline/connector";
import { addLandlineTransfers } from "../landline/landlineClogMatcher";
import { ViemClient } from "../network/viemClient";
import { InviteCodeTracker } from "../offchain/inviteCodeTracker";
import { InviteGraph } from "../offchain/inviteGraph";
import { getAppVersionTracker } from "../server/appVersion";
import { TrpcRequestContext } from "../server/trpc";

export interface AccountHistoryResult {
  address: Address;
  sinceBlockNum: number;

  lastFinalizedBlock: number;
  lastBlock: number;
  lastBlockTimestamp: number;
  lastBalance: `${bigint}`;

  chainGasConstants: ChainGasConstants;
  recommendedExchanges: RecommendedExchange[];

  transferLogs: TransferClog[];
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

  landlineSessionURL: string;
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
  lang: string | undefined,
  vc: ViemClient,
  homeCoinIndexer: HomeCoinIndexer,
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
  extApiCache: ExternalApiCache,
  blockNumber: number,
  version: string | undefined
): Promise<AccountHistoryResult> {
  const eAcc = nameReg.getDaimoAccount(address);
  assert(
    eAcc != null && eAcc.name != null,
    `${address} is not a Daimo account`
  );
  const startMs = performance.now();
  // Split version string into appVersion and buildVersion
  let appVersion: string | undefined;
  if (version) {
    const parts = version.split(" #");
    appVersion = parts[0];
    assert(
      semver.valid(appVersion) != null,
      `${version} is not a valid app version`
    );
  }
  const log = `[API] getAccountHist: ${eAcc.name} ${address} since ${sinceBlockNum}`;
  console.log(`${log}: starting`);

  // Get latest finalized block. Next account sync, fetch since this block.
  const finBlock = await vc.getFinalizedBlock();
  if (finBlock.number == null) throw new Error("No finalized block");
  if (finBlock.number < sinceBlockNum) {
    console.log(`${log}: sinceBlockNum > finalized block ${finBlock.number}`);
  }

  // Get the latest block + current balance.
  assert(
    blockNumber >= Number(finBlock.number),
    `Latest block ${blockNumber} < finalized ${finBlock.number}`
  );
  const lastBlock = blockNumber;
  const lastBlockTimestamp = guessTimestampFromNum(
    lastBlock,
    chainConfig.daimoChain
  );
  const lastBalance = homeCoinIndexer.getCurrentBalance(address);

  // TODO: get userops, including reverted ones. Show failed sends.

  // Get successful transfers since sinceBlockNum
  let transferClogs = homeCoinIndexer.filterTransfers({
    addr: address,
    sinceBlockNum: BigInt(sinceBlockNum),
  });
  let elapsedMs = (performance.now() - startMs) | 0;
  console.log(`${log}: ${elapsedMs}ms ${transferClogs.length} logs`);

  // Get account keys
  const accountKeys = keyReg.resolveAddressKeys(address);
  assert(accountKeys != null, `${address} has no account keys`);

  // Prefetch info required to send operations > fast at time of sending.
  const chainGasConstants = await paymaster.calculateChainGasConstants(eAcc);

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
  elapsedMs = (performance.now() - startMs) | 0;
  console.log(`${log}: ${elapsedMs}ms: ${invitees.length} invitees`);

  // Get pfps from linked accounts
  const profilePicture = profileCache.getProfilePicture(address);

  // Get request data for this user
  const notificationRequestStatuses = requestIndexer.getAddrRequests(address);

  // Get proposed swaps of non-home coin tokens for address
  const swaps = await foreignCoinIndexer.getProposedSwapsForAddr(address);
  elapsedMs = (performance.now() - startMs) | 0;
  console.log(`${log}: ${elapsedMs}: ${swaps.length} swaps`);

  // Get exchange rates
  const exchangeRates = await getExchangeRates(extApiCache);

  // Get landline session key and accounts
  let landlineSessionURL = "";
  let landlineAccounts: LandlineAccount[] = [];

  // Landline supported starting in 1.9.11
  let landlineSessionKey: string | undefined;
  if (
    getEnvApi().LANDLINE_API_URL &&
    appVersion &&
    semver.gte(appVersion, "1.9.11")
  ) {
    const daimoAddress = address;
    const llSession = await getLandlineSession({ daimoAddress }, ctx);
    landlineSessionKey = llSession.key;
    landlineSessionURL = getLandlineURL(address, landlineSessionKey);
    landlineAccounts = await getLandlineAccounts({ daimoAddress }, ctx);

    const landlineTransfers = await getLandlineTransfers({ daimoAddress }, ctx);
    transferClogs = addLandlineTransfers(
      landlineTransfers,
      transferClogs,
      chainConfig.daimoChain
    );
  }

  // Get named accounts
  const namedAccounts = await getNamedAccountsFromClogs(
    transferClogs,
    landlineAccounts,
    nameReg
  );

  // Prefetch info required to deposit to your Daimo account.
  const recommendedExchanges = await fetchRecommendedExchanges({
    account: eAcc,
    language: lang,
    landlineSessionKey,
  });

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

    transferLogs: transferClogs,
    namedAccounts,
    accountKeys,
    linkedAccounts,
    profilePicture,
    inviteLinkStatus,
    invitees,
    notificationRequestStatuses,
    proposedSwaps: swaps,
    exchangeRates,

    landlineSessionURL,
    landlineAccounts,
  };

  // Suggest an action to the user, like backing up their account
  const suggestedActions = getSuggestedActions(eAcc, ret, ctx, lang);

  elapsedMs = (performance.now() - startMs) | 0;
  console.log(`${log}: ${elapsedMs}ms: done, returning`);
  return { ...ret, suggestedActions };
}

async function getNamedAccountsFromClogs(
  clogs: TransferClog[],
  landlineAccounts: LandlineAccount[],
  nameReg: NameRegistry
): Promise<EAccount[]> {
  const addrs = new Set<Address>();
  clogs.forEach((clog) => {
    addrs.add(clog.from);
    addrs.add(clog.to);
    if (clog.type === "claimLink" || clog.type === "createLink") {
      if (clog.noteStatus.claimer) addrs.add(clog.noteStatus.claimer.addr);
      addrs.add(clog.noteStatus.sender.addr);
    }
  });
  const namedAccounts = (
    await Promise.all([...addrs].map((addr) => nameReg.getEAccount(addr)))
  ).filter((acc) => hasAccountName(acc));

  // Map Landline liquidation addresses to the corresponding bank account
  for (const landlineAccount of landlineAccounts) {
    namedAccounts.push({
      addr: landlineAccount.liquidationAddress,
      name: getLandlineAccountName(landlineAccount),
    });
  }

  return namedAccounts;
}

function getSuggestedActions(
  eAcc: EAccount,
  hist: AccountHistoryResult,
  ctx: TrpcRequestContext,
  lang?: string
) {
  const ret: SuggestedAction[] = [];
  const t = i18n(lang).suggestedActions;

  // Not on latest version? Ask them to upgrade.
  const latestVersion = getAppVersionTracker().getLatestVersion();
  const { daimoPlatform, daimoVersion } = ctx;
  const appVersion = daimoVersion.split(" ")[0];
  if (appVersion && latestVersion && semverLt(appVersion, latestVersion)) {
    ret.push({
      id: `2024-02-update-${appVersion}-to-${latestVersion}`,
      title: t.upgrade.title(),
      subtitle: t.upgrade.subtitle(latestVersion),
      url: appStoreLinks[daimoPlatform.startsWith("ios") ? "ios" : "android"],
    });
  }

  // If account is not backed up, asked them to create a backup
  if (hist.accountKeys.length === 1) {
    ret.push({
      id: "2024-02-passkey-backup",
      title: t.backup.title(),
      subtitle: t.backup.subtitle(),
      url: `daimo://settings/add-passkey`,
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
  return `https://www.relay.link/app/daimo?toChainId=8453&toCurrency=0x833589fcd6edb6e08f4c7c32d4f71b54bda02913&lockToToken=true&toAddress=${account.addr}`;
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

function fetchRecommendedExchanges({
  account,
  language,
  landlineSessionKey,
}: {
  account: EAccount;
  language?: string;
  landlineSessionKey?: string;
}): RecommendedExchange[] {
  const i18 = i18n(landlineSessionKey).recommendedExchange;

  const ret = [
    {
      cta: i18.bridge.cta(),
      title: i18.bridge.title(),
      url: getBridgeURL(account),
      logo: `${daimoDomainAddress}/assets/deposit/ethereum.png`,
      sortId: 0,
    },
    {
      cta: i18.coinbase.cta(),
      title: i18.coinbase.title(),
      url: getCoinbaseURL(account),
      logo: `${daimoDomainAddress}/assets/deposit/coinbase.png`,
      sortId: 1,
    },
    // 2 is Binance, loaded client-side on demand.
    {
      cta: i18.ramp.cta(),
      title: i18.ramp.title(),
      url: getRampNetworkURL(account),
      logo: `${daimoDomainAddress}/assets/deposit/usdc.png`,
      sortId: 4,
    },
  ];

  if (landlineSessionKey != null && FeatFlag.tronramp(account)) {
    const llHost = assertNotNull(getEnvApi().LANDLINE_DOMAIN);
    ret.push({
      cta: `Preview · Tron Deposit`,
      title: `Receive USDT TRC-20`,
      url: `${llHost}/tron/${account.addr}/${landlineSessionKey}`,
      logo: `${daimoDomainAddress}/assets/deposit/usdt-tron.png`,
      sortId: 3,
    });
  }

  return ret;
}
