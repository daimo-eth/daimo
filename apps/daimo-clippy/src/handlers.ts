import { assertNotNull, formatDaimoLink, parseDaimoLink } from "@daimo/common";
import { Address, getAddress } from "viem";

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
    return help(`Invalid args ${text}`);

  try {
    return await command.fn(parseKwargs(args.slice(2)));
  } catch (e) {
    console.error(`[SLACK-BOT] Error handling command: ${e}`);
    return help(`Error handling command ${text}: ${e}`);
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
  help: {
    help: "Show this help message",
    fn: (_) => help(),
  },
};

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

async function help(extraText?: string) {
  let res = "";
  if (extraText) res = `${extraText}\n\n`;
  res += "Available commands:\n";
  for (const [name, cmd] of Object.entries(commands)) {
    res += `${name} ${cmd.help}\n`;
  }
  return res;
}
