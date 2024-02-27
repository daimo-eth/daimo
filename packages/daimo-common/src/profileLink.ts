import z from "zod";

import { zAddress, zHex } from "./model";

// Farcaster profile summary, linked to Daimo account via signature.
// The Daimo address is the nonce in the signed message.
export const zFarcasterLinkedAccount = z.object({
  // All LinkedAccounts will have (type, key).
  type: z.literal("farcaster"),
  id: z.string(),

  // Remaining fields are app-specific.
  fid: z.number(),
  custody: zAddress,
  message: z.string(),
  signature: zHex,
  verifications: z.array(z.string()),
  username: z.string().optional(),
  displayName: z.string().optional(),
  pfpUrl: z.string().optional(),
  bio: z.string().optional(),
});

export type FarcasterLinkedAccount = z.infer<typeof zFarcasterLinkedAccount>;

export const zLinkedAccount = zFarcasterLinkedAccount;

export type LinkedAccount = z.infer<typeof zLinkedAccount>;

// Represents a link from a Daimo account to an external account.
export const zProfileLink = z.object({
  addr: zAddress,
  linkedAccount: zLinkedAccount,
});

export type ProfileLink = z.infer<typeof zProfileLink>;

export const zProfileLinkID = z.object({
  addr: zAddress,
  type: z.string(),
  id: z.string(),
});

export type ProfileLinkID = z.infer<typeof zProfileLinkID>;
