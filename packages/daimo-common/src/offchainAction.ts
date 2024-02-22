import z from "zod";

import { zProfileLink, zProfileLinkID } from "./profileLink";

const zOffchainActionProfileLink = z.object({
  time: z.number(),
  type: z.literal("profileLink"),
  link: zProfileLink,
});

export type OffchainActionProfileLink = z.infer<
  typeof zOffchainActionProfileLink
>;

const zOffchainActionProfileUnlink = z.object({
  time: z.number(),
  type: z.literal("profileUnlink"),
  linkID: zProfileLinkID,
});

export type OffchainActionProfileUnlink = z.infer<
  typeof zOffchainActionProfileUnlink
>;

export const zOffchainAction = z.union([
  zOffchainActionProfileLink,
  zOffchainActionProfileUnlink,
]);

export type OffchainAction = z.infer<typeof zOffchainAction>;
