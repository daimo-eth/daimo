import { assert, assertNotNull } from "@daimo/common";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { rpc } from "../../../utils/rpc";

// Handle all slash commands from Slack
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const token = formData.get("token") as string;
    const command = formData.get("command") as string;
    const text = formData.get("text") as string;

    if (!token || !command || !text) {
      throw new Error("Invalid request");
    }

    if (token !== process.env.SLACK_COMMAND_TOKEN) {
      throw new Error("[SLACK-BOT] Token not recognized");
    }

    const res = await handleCommand(command, text);

    return NextResponse.json(
      { blocks: [{ type: "section", text: { type: "mrkdwn", text: res } }] },
      { status: 200 }
    );
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
  console.log(`[SLACK-BOT] Handling command ${command} - ${text}`);

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

async function setMaxUses(url: string, maxUses: number) {
  // TODO

  return "";
}

function help() {
  return ``;
}

function parseCommandText(command: string, text: string): CommandPayload {
  if (command === "/create-invite") {
    const parts = text.trim().split(" ");

    // This can change when there are default values for some of the arguments.
    assert(parts.length === 5, "Missing arguments for /create-invite");

    const keys = new Set(Object.keys(keyMap));

    const payload: Partial<
      Record<(typeof keyMap)[keyof typeof keyMap], string | number>
    > = {};

    for (const part of parts) {
      const [key, value] = part
        .trim()
        .split("=")
        .map((x) => x.trim());

      if (!keys.has(key)) {
        throw new Error(
          `[SLACK-BOT] Bad command: Unrecognized parameter ${key}`
        );
      }

      if (!value) {
        throw new Error(
          `[SLACK-BOT] Bad command: No value provided for ${key} parameter`
        );
      }

      const parsedKey = keyMap[key as keyof typeof keyMap];
      payload[parsedKey] = NUMBER_KEYS.includes(key) ? Number(value) : value;
    }

    return validateCreateInvite(payload);
  }

  throw new Error("");
}

// Create invite validation

const NUMBER_KEYS = [
  "bonus_dollars_invitee",
  "bonus_dollars_inviter",
  "max_uses",
];

const keyMap = {
  code: "code",
  bonus_dollars_invitee: "bonusDollarsInvitee",
  bonus_dollars_inviter: "bonusDollarsInviter",
  max_uses: "maxUses",
  inviter: "inviter",
} as const;

const CreateInviteSchema = z.object({
  code: z.string(),
  bonusDollarsInvitee: z.number(),
  bonusDollarsInviter: z.number(),
  maxUses: z.number(),
  inviter: z.string(),
});

function validateCreateInvite(payload: object) {
  try {
    return CreateInviteSchema.parse(payload);
  } catch (error) {
    throw error;
  }
}
