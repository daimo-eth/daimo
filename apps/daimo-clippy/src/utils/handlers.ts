import { assertNotNull, parseDaimoLink } from "@daimo/common";

import { parseCreateInviteText } from "./parsers";
import { rpc } from "./rpc";
import { CreateInviteLinkPayload } from "./types";

export async function handleCommand(
  command: string,
  text: string
): Promise<string> {
  console.log(`[SLACK-BOT] Handling command ${command} - ${text}`);

  if (command === "/create-invite") {
    return createInvite(parseCreateInviteText(text));
  } else if (command === "/view-invite-status") {
    const strippedText = text.trim().split("=");

    if (strippedText[0] !== "link") {
      throw new Error(`[SLACK-BOT] Unrecognized parameter ${strippedText[0]}`);
    }

    if (!strippedText[1]) {
      throw new Error(`[SLACK-BOT] view-invite-status No link provided`);
    }

    return viewInviteStatus(strippedText[1]);
  } else if (command === "/set-max-uses") {
    const strippedText = text.trim();
    const parts = strippedText.split(" ");

    let url = "";
    let maxUses: number | undefined = undefined;

    for (const part of parts) {
      const [key, value] = part.split("=").map((x) => x.trim());

      if (key === "link") {
        url = value;
      } else if (key === "max_uses") {
        maxUses = Number(value);
      }
    }

    if (!url) {
      throw new Error("[SLACK-BOT] /set-max-uses: No invite link specified");
    }

    if (!maxUses) {
      throw new Error("[SLACK-BOT] /set-max-uses: No max uses specified");
    }

    return setMaxUses(url, maxUses);
  } else if (command === "/help") {
    return help();
  }

  throw new Error(`[SLACK-BOT] Unrecognized slash command: ${command}`);
}

// Command handlers

async function createInvite(payload: CreateInviteLinkPayload) {
  const apiKey = assertNotNull(process.env.DAIMO_API_KEY);

  const res = await rpc.createInviteLink.mutate({ apiKey, ...payload });
  const details = await viewInviteStatus(res);

  return `Successfully created invite: ${res} \n ${details}`;
}

async function viewInviteStatus(url: string) {
  const inviteStatus = await rpc.getLinkStatus.query({ url });

  return `\`${JSON.stringify(inviteStatus)}\``;
}

async function setMaxUses(url: string, maxUses: number) {
  const apiKey = assertNotNull(process.env.DAIMO_API_KEY);

  const link = parseDaimoLink(url);

  if (link?.type !== "invite") {
    throw new Error("[SLACK-BOT] /set-max-uses Incorrect link type");
  }

  const res = await rpc.updateInviteLink.mutate({
    apiKey,
    code: link.code,
    maxUses,
  });

  const details = await viewInviteStatus(res);

  return `Successfully updated invite: ${res} \n ${details}`;
}

function help() {
  return `There are three included commands that help you with handling Daimo invites: \n
  \`/create-invite\` - Creates a Daimo invite. [code, bonus_dollars_invitee, bonus_dollar_inviter, max_uses, inviter] \n
  \`/view-invite-status\` - Shows all invite properties in JSON format. [link] \n
  \`/set-max-uses\` - Updates the "max_uses" property of invites. [link, max_uses]\n
  **Note**: Args must be named, but the order does not matter\n
  e.g. \`/create invite code=test bonus_dollars_invitee=0 bonus_dollars_inviter max_uses=5 inviter=0x...\`
  `;
}
