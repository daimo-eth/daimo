import { assert, assertNotNull } from "@daimo/common";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { rpc } from "../../../utils/rpc";

// Handle all slash commands from Slack
export async function POST(request: NextRequest) {
  const data = await request.json();
  const { token, command, text } = data;

  if (token !== process.env.SLACK_COMMAND_TOKEN) {
    throw new Error("[SLACK-BOT] Token not recognized");
  }

  await handleCommand(command, text);

  try {
    return NextResponse.json({}, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: (error as Error)?.message },
      { status: 500 }
    );
  }
}

type CreateInviteLinkPayload = {
  code: string;
  bonusDollarsInvitee: number;
  bonusDollarsInviter: number;
  maxUses: number;
  inviter: string;
};

type CommandPayload = CreateInviteLinkPayload;

async function handleCommand(command: string, text: string): Promise<string> {
  if (command === "/create-invite") {
    return createInvite(parseCommandText(command, text));
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
    return setMaxUses();
  } else if (command === "/help") {
    return help();
  }

  throw new Error(`[SLACK-BOT] Unrecognized slash command: ${command}`);
}

async function createInvite(payload: CreateInviteLinkPayload) {
  const apiKey = assertNotNull(process.env.DAIMO_API_KEY);

  const res = await rpc.createInviteLink.mutate({ apiKey, ...payload });
  const details = await viewInviteStatus(res);

  return `Successfully created invite: ${res} \n ${details}`;
}

async function viewInviteStatus(url: string) {
  const inviteStatus = await rpc.getLinkStatus.query({ url });

  return `<pre>${JSON.stringify(inviteStatus)}</pre>`;
}

async function setMaxUses(url: string) {
  // TODO

  return "";
}

function help() {
  return ``;
}

function verifyToken(token: string) {}

function parseCommandText(command: string, text: string): CommandPayload {
  if (command === "/create-invite") {
    const parts = text.trim().split(" ");
    assert(parts.length === 5);

    const createInvitePayload = {
      code: "",
      bonusDollarsInvitee: 0,
      bonusDollarsInviter: 0,
      maxUses: 0,
      inviter: "",
    };

    const keyMap = {
      code: "code",
      bonus_dollars_invitee: "bonusDollarsInvitee",
      bonus_dollars_inviter: "bonusDollarsInviter",
      max_uses: "maxUses",
      inviter: "inviter",
    } as const;

    const keys = new Set(Object.keys(keyMap));

    for (const part of parts) {
      const [key, value] = part.trim().split("=");
      const trimmedKey = key.trim();
      const trimmedValue = value.trim();

      if (!keys.has(trimmedKey)) {
        throw new Error(
          `[SLACK-BOT] Bad command: Unrecognized parameter ${key}`
        );
      }

      if (!trimmedValue) {
        throw new Error(
          `[SLACK-BOT] Bad command: No value provided for ${key} parameter`
        );
      }

      const parsedKey = keyMap[trimmedKey as keyof typeof keyMap];

      createInvitePayload[parsedKey] = [
        "bonus_dollars_invitee",
        "bonus_dollars_inviter",
        "max_uses",
      ].includes(trimmedKey)
        ? Number(trimmedValue)
        : trimmedValue;
    }

    return createInvitePayload;
  } /* else if (command === "/view-invite-status") {
    return "";
  } else if (command === "/set-max-uses") {
    return "";
  } else if (command === "/help") {
    return "";
  } */

  throw new Error("");
}
