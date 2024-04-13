import { assert } from "@daimo/common";

import { CreateInviteLinkPayload } from "./types";
import { CreateInviteSchema, NUMBER_KEYS, keyMap } from "./validation";

export function parseCreateInviteText(text: string): CreateInviteLinkPayload {
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
      throw new Error(`[SLACK-BOT] Bad command: Unrecognized parameter ${key}`);
    }

    if (!value) {
      throw new Error(
        `[SLACK-BOT] Bad command: No value provided for ${key} parameter`
      );
    }

    const parsedKey = keyMap[key as keyof typeof keyMap];
    payload[parsedKey] = NUMBER_KEYS.includes(key) ? Number(value) : value;
  }

  return CreateInviteSchema.parse(payload);
}
