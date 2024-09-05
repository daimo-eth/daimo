import z from "zod";

import { zDollarStr } from "./model";
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
  type: z.literal("profileUnlink"),
  time: z.number(),
  linkID: zProfileLinkID,
});

export type OffchainActionProfileUnlink = z.infer<
  typeof zOffchainActionProfileUnlink
>;

const zOffchainActionLandlineDeposit = z.object({
  type: z.literal("landlineDeposit"),
  time: z.number(),
  landlineAccountUuid: z.string(),
  amount: zDollarStr,
  memo: z.string(),
});

export type OffchainActionLandlineDeposit = z.infer<
  typeof zOffchainActionLandlineDeposit
>;

export const zOffchainAction = z.union([
  zOffchainActionProfileLink,
  zOffchainActionProfileUnlink,
  zOffchainActionLandlineDeposit,
]);

export type OffchainAction = z.infer<typeof zOffchainAction>;
