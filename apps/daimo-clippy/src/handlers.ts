import {
  EAccount,
  amountToDollars,
  assertNotNull,
  dollarsToAmount,
  formatDaimoLink,
  getSlotLabel,
  parseDaimoLink,
} from "@daimo/common";
import { Address, getAddress, isAddress } from "viem";

import { chainConfig } from "./env";
import { rpc } from "./rpc";
import { getJSONblock, parseKwargs, unfurlLink } from "./utils";

const apiKey = assertNotNull(process.env.DAIMO_API_KEY);

export async function handleCommand(text: string): Promise<string> {
  console.log(`[SLACK-BOT] Handling command ${text}`);

  const args = text.trim().split(" ");

  const slackBotName = "<@U0610TSAFAR>";

  if (args.length < 2) return help(`Missing command ${text}`);
  if (args[0] !== slackBotName) return help(`Start with ${slackBotName}`);

  const command = commands[args[1]];
  if (!command) return help(`Unknown command ${text}`);
  if (args[2] === "help") return command.help;

  // Check all remaining args are kwargs.
  if (args.slice(2).some((a) => !a.includes("=")))
    return help(`Invalid args ${text}`, args[1]);

  try {
    return await command.fn(parseKwargs(args.slice(2)));
  } catch (e) {
    console.error(`[SLACK-BOT] Error handling command: ${e}`);
    return help(`Error handling command ${text}: ${e}`, args[1]);
  }
}

// Command handlers

type Command = {
  help: string;
  fn: (kwargs: Map<string, string>) => Promise<string>;
};

const commands: Record<string, Command> = {
  grant: {
    help: "Grant an invite to a user. Args: [user, dollars (optional, default $10)]",
    fn: grantInvite,
  },
  "create-invite": {
    help: "Create a new invite link. Args: [code, bonus_dollars_invitee, bonus_dollar_inviter, max_uses, inviter]",
    fn: createInvite,
  },
  "view-invite-status": {
    help: "View invite status. Args: [link, invite_code, sender]",
    fn: viewInviteStatus,
  },
  "set-max-uses": {
    help: "Set max uses. Args: [link, max_uses]",
    fn: setMaxUses,
  },
  "disable-invite-bonus": {
    help: "Disable invite bonus. Args: [link]",
    fn: disableInviteBonus,
  },
  "get-user": {
    help: "Gets name, address and balance of a user. Args: [user = name or addr]",
    fn: getUser,
  },
  "get-swap-quote": {
    help: "Gets the best swap quote for fromToken to toToken. Args: [fromAmount=1.23, fromToken=DAI, toToken=USDC]",
    fn: getSwapQuote,
  },
  health: {
    help: "Checks that the API is up",
    fn: health,
  },
  help: {
    help: "Show this help message",
    fn: (_) => help(),
  },
};

async function health(): Promise<string> {
  const health = await rpc.health.query();
  return JSON.stringify(health);
}

async function getUser(kwargs: Map<string, string>): Promise<string> {
  const user = kwargs.get("user");
  if (!user) throw new Error("Must specify user");

  let address: Address;
  let eAcc: EAccount;
  if (isAddress(user)) {
    address = getAddress(user);
    eAcc = await rpc.getEthereumAccount.query({ addr: address });
  } else {
    const addr = await rpc.resolveName.query({ name: user });
    if (addr == null) return `User '${user}' not found`;
    eAcc = { addr, name: user };
    address = addr;
  }

  if (eAcc.name == null) {
    console.log(`Not a Daimo account: ${JSON.stringify(eAcc)}`);
  }

  const hist = await rpc.getAccountHistory.query({ address, sinceBlockNum: 0 });

  return [
    `Name        : ${eAcc.name}`,
    `Address     : ${address}`,
    `Balance     : ${amountToDollars(BigInt(hist.lastBalance))} USDC`,
    `Keys        : ${hist.accountKeys
      .map((k) => getSlotLabel(k.slot))
      .join(", ")}`,
    `Linked Accts: ${hist.linkedAccounts
      .map((a) => `${a.type} ${a.username}`)
      .join(", ")}`,
    `# swaps     : ${hist.proposedSwaps.length}`,
    `# transfers : ${hist.transferLogs.length}`,
  ].join("\n");
}

type TokenList = {
  tokens: {
    chainId: number;
    address: Address;
    name: string;
    symbol: string;
    decimals: number;
    logoURI?: string;
  }[];
  version: any;
};
let tokenListPromise: Promise<TokenList> | null = null;

async function getTokenList(): Promise<TokenList> {
  if (tokenListPromise == null) {
    tokenListPromise = fetch("https://tokens.coingecko.com/base/all.json").then(
      (a) => a.json()
    );
  }
  return tokenListPromise;
}

// Gets a swap quote from the onchain contract.
async function getSwapQuote(kwargs: Map<string, string>): Promise<string> {
  const strN = kwargs.get("fromAmount");
  const strFromToken = kwargs.get("fromToken");
  const strToToken = kwargs.get("toToken");
  if (!strN || !strFromToken || !strToToken)
    return "Must specify fromAmount, fromToken and toToken";

  const { tokens } = await getTokenList();
  const fromToken = tokens.find(
    (t) => t.symbol === strFromToken || t.address === strFromToken.toLowerCase()
  );
  if (fromToken == null) return `Token '${strFromToken}' not found`;

  const toToken = tokens.find(
    (t) => t.symbol === strToToken || t.address === strToToken.toLowerCase()
  );
  if (toToken == null) return `Token '${strToToken}' not found`;

  const amountIn = dollarsToAmount(Number(strN), fromToken.decimals);
  const chainId = chainConfig.daimoChain === "base" ? 8453 : 84532;

  const route = await rpc.getSwapQuote.query({
    amountIn: `${amountIn}`,
    fromToken: fromToken.address,
    toToken: toToken.address,
    fromAccount: {
      addr: getAddress("0xdeaddeaddeaddeaddeaddeaddeaddeaddeaddead"),
    },
    toAddr: getAddress("0xdeaddeaddeaddeaddeaddeaddeaddeaddeaddead"),
    chainId,
  });

  if (!route) {
    return [
      `No route found from ${fromToken.symbol} (${fromToken.address})`,
      `to ${toToken.symbol} (${toToken.address})`,
    ].join("\n");
  }
  const fromStr = `${amountIn} ${fromToken.symbol}`; // eg 1.23 DAI
  return [
    `From ${fromToken.symbol} (${fromToken.address})`,
    `To ${toToken.symbol} (${toToken.address})`,
    `Fetched route for ${fromStr} to ${toToken.symbol}: ${JSON.stringify(
      route,
      null,
      2
    )}`,
  ].join("\n");
}

async function grantInvite(kwargs: Map<string, string>): Promise<string> {
  const code = Array(8)
    .fill(0)
    .map(() => "abcdefghijklmnopqrstuvwxyz"[(Math.random() * 26) | 0])
    .join("");

  const name = assertNotNull(kwargs.get("user"));
  if (name == null) return "Missing user";

  const addr = await rpc.resolveName.query({ name });
  if (addr == null) return `User '${name}' not found`;

  const dollars = Number(kwargs.get("dollars") || 10);
  const maxUses = 10;

  console.log(
    `[SLACK-BOT] granting invite to ${name}: ${code}, $${dollars}, max ${maxUses} uses`
  );

  await createInviteCode(code, dollars, dollars, maxUses, addr);

  return `Granted ${name} an invite. Bonus: $${dollars}. Max uses: ${maxUses}`;
}

async function createInvite(kwargs: Map<string, string>): Promise<string> {
  const code = assertNotNull(kwargs.get("code"));
  const bonusDollarsInvitee = Number(
    assertNotNull(kwargs.get("bonus_dollars_invitee"))
  );
  const bonusDollarsInviter = Number(
    assertNotNull(kwargs.get("bonus_dollars_inviter"))
  );
  const maxUses = Number(assertNotNull(kwargs.get("max_uses")));
  const inviter = getAddress(assertNotNull(kwargs.get("inviter")));

  return createInviteCode(
    code,
    bonusDollarsInvitee,
    bonusDollarsInviter,
    maxUses,
    inviter
  );
}

export async function createInviteCode(
  code: string,
  bonusDollarsInvitee: number,
  bonusDollarsInviter: number,
  maxUses: number,
  inviter: Address
) {
  const res = await rpc.createInviteLink.mutate({
    apiKey,
    code,
    bonusDollarsInvitee,
    bonusDollarsInviter,
    maxUses,
    inviter,
  });
  const inviteStatus = await rpc.getLinkStatus.query({ url: res });

  return `Successfully created invite: ${res}\n\n ${getJSONblock(
    inviteStatus
  )}`;
}

async function viewInviteStatus(kwargs: Map<string, string>): Promise<string> {
  const url = await (async () => {
    if (kwargs.has("link")) {
      return unfurlLink(assertNotNull(kwargs.get("link")));
    } else if (kwargs.has("invite_code")) {
      const inviteCode = assertNotNull(kwargs.get("invite_code"));
      return formatDaimoLink({ type: "invite", code: inviteCode });
    } else if (kwargs.has("sender")) {
      const sender = assertNotNull(kwargs.get("sender"));
      const inviteCode = await rpc.getBestInviteCodeForSender.query({
        apiKey,
        sender,
      });
      if (!inviteCode) return null;
      return formatDaimoLink({ type: "invite", code: inviteCode });
    } else return null;
  })();

  if (!url) return help("No link found");

  const inviteStatus = await rpc.getLinkStatus.query({ url });

  return `${getJSONblock(inviteStatus)}`;
}

async function disableInviteBonus(kwargs: Map<string, string>) {
  const link = parseDaimoLink(unfurlLink(assertNotNull(kwargs.get("link"))));

  if (link?.type !== "invite") {
    return help("disable-invite-bonus invalid link type");
  }

  const res = await rpc.updateInviteLink.mutate({
    apiKey,
    code: link.code,
    bonusDollarsInvitee: 0,
    bonusDollarsInviter: 0,
  });
  const inviteStatus = await rpc.getLinkStatus.query({ url: res });

  return `Successfully disabled invite bonus: ${res}\n\n${getJSONblock(
    inviteStatus
  )}`;
}

async function setMaxUses(kwargs: Map<string, string>) {
  const link = parseDaimoLink(unfurlLink(assertNotNull(kwargs.get("link"))));
  const maxUses = Number(assertNotNull(kwargs.get("max_uses")));

  if (link?.type !== "invite") {
    return help("set-max-uses invalid link type");
  }

  const res = await rpc.updateInviteLink.mutate({
    apiKey,
    code: link.code,
    maxUses,
  });

  const inviteStatus = await rpc.getLinkStatus.query({ url: res });

  return `Successfully updated invite: ${res}\n\n${getJSONblock(inviteStatus)}`;
}

async function help(extraText?: string, cmdName?: string) {
  let res = "";
  if (extraText) res = `${extraText}\n\n`;
  if (cmdName) {
    res += `${cmdName}: ${commands[cmdName].help}\n`;
  } else {
    res += "Available commands:\n";
    for (const [name, cmd] of Object.entries(commands)) {
      res += `${name} ${cmd.help}\n`;
    }
  }
  return res;
}
