import { assert, zCreateInviteLinkArgs } from "@daimo/common";
import z from "zod";

import { CreateInviteLinkPayload } from "./types";
import { CREATE_INVITE_KEY_SET } from "./validation";

export function parseCreateInviteText(text: string): CreateInviteLinkPayload {
  const parts = text.trim().split(" ");

  // This can change when there are default values for some of the arguments.
  assert(parts.length === 5, "Missing arguments for /create-invite");

  const payload: Record<string, string> = {};

  for (const part of parts) {
    const [key, value] = part
      .trim()
      .split("=")
      .map((x) => x.trim());

    // Key validation uses set to make the error message generation cleaner.
    if (!CREATE_INVITE_KEY_SET.has(key)) {
      throw new Error(`[SLACK-BOT] Bad command: Unrecognized parameter ${key}`);
    }

    if (!value) {
      throw new Error(
        `[SLACK-BOT] Bad command: No value provided for ${key} parameter`
      );
    }

    payload[key] = value;
  }

  return zCreateInviteLinkArgs.parse({
    ...payload,
    bonusDollarsInvitee: z.number().int().parse(payload.bonus_dollars_invitee),
    bonusDollarsInviter: z.number().int().parse(payload.bonus_dollars_inviter),
    maxUses: z.number().int().parse(payload.max_uses),
  });
}

export function parseViewInviteStatusText(text: string) {
  const strippedText = text.trim().split("=");

  if (strippedText[0] !== "link") {
    throw new Error(`[SLACK-BOT] Unrecognized parameter ${strippedText[0]}`);
  }

  if (!strippedText[1]) {
    throw new Error(`[SLACK-BOT] view-invite-status No link provided`);
  }

  return strippedText[1];
}

export function parseSetMaxUsesText(text: string) {
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

  return { url, maxUses };
}
