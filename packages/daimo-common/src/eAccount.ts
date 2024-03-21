import { Address } from "viem";
import z from "zod";

import { AddrLabel, zAddress } from "./model";
import { zLinkedAccount } from "./profileLink";

export const zEAccount = z.object({
  addr: zAddress,
  /** Daimo account name */
  name: z.string().optional(),
  /** Daimo account registration time */
  timestamp: z.number().optional(),
  /** Daimo account inviter address */
  inviter: zAddress.optional(),
  /** Label for special addresses like the faucet */
  label: z.nativeEnum(AddrLabel).optional(),
  /** ENS name */
  ensName: z.string().optional(),
  /** Linked profiles for a Daimo account */
  linkedAccounts: z.array(zLinkedAccount).optional(),
  /** Profile picture */
  profilePicture: z.string().optional(),
});

/** EAccount represents any Ethereum address + display name(s). */
export type EAccount = z.infer<typeof zEAccount>;

/** EAccountSearchResult is an EAccount + shows what we matched on. */
export interface EAccountSearchResult extends EAccount {
  originalMatch: string;
}

/** Returns eg "bob", "alice.eth", or "0x123..." */
export function getEAccountStr(eAccount: EAccount): string {
  if (eAccount.name) return eAccount.name;
  if (eAccount.ensName) return eAccount.ensName;
  return eAccount.addr;
}

export function getAddressContraction(address: Address): string {
  return address.slice(0, 6) + "…" + address.slice(-4);
}

/** Gets a display name or 0x... address contraction. */
export function getAccountName(acc: EAccount): string {
  const str = acc.name || acc.label || acc.ensName;
  if (str) return str;

  return getAddressContraction(acc.addr);
}

/** Whether we can (potentially) send funds to this address. */
export function canSendTo(acc: EAccount): boolean {
  // Daimo accounts, ENS & bare addresses can receive funds.
  if (acc.label == null) return true;
  // Certain labelled accounts cannot.
  return ![AddrLabel.PaymentLink, AddrLabel.Paymaster].includes(acc.label);
}

export function canRequestFrom(acc: EAccount): boolean {
  return !!acc.name;
}

/** True if account has a display name, false if bare address. */
export function hasAccountName(acc: EAccount): boolean {
  return !!(acc.name || acc.label || acc.ensName);
}
