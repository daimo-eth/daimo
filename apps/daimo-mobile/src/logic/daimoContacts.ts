import {
  EAccount,
  EAccountSearchResult,
  EmailAddress,
  LandlineAccount,
  PhoneNumber,
  TransferClog,
  TransferSwapClog,
  canSendTo,
  getAccountName,
  getDisplayFromTo,
  getTransferClogType,
  zEmailAddress,
  zPhoneNumber,
} from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import { Locale } from "expo-localization";
import { Address } from "viem";

import { getCachedEAccount } from "./eAccountCache";
import { getCachedLandlineAccount } from "./landlineAccountCache";
import { useSystemContactsSearch } from "./systemContacts";
import { getRpcHook } from "./trpc";
import IconDepositWallet from "../../assets/icon-deposit-wallet.png";
import { Account } from "../storage/account";

interface BaseDaimoContact {
  lastSendTime?: number;
  lastRecvTime?: number;
}

export interface EAccountContact extends EAccount, BaseDaimoContact {
  type: "eAcc";
  originalMatch?: string;
}

export interface EmailContact extends BaseDaimoContact {
  type: "email";
  email: EmailAddress;
  name?: string;
}

export interface PhoneNumberContact extends BaseDaimoContact {
  type: "phoneNumber";
  phoneNumber: PhoneNumber;
  name?: string;
}

export interface LandlineBankAccountContact extends EAccount, BaseDaimoContact {
  type: "landlineBankAccount";
  landlineAccountUuid: string;
  bankName: string;
  bankLogo: string | null;
  accountNumberLastFour: string;
}

// A DaimoContact is a "contact" of the user in the app.
// Includes EAccounts and system contacts (email, phone number) with added
// context about the contact based on user's own context. (lastSendTime, etc.)
export type DaimoContact =
  | EAccountContact
  | EmailContact
  | PhoneNumberContact
  | LandlineBankAccountContact;

// A MsgContact is a contact that is not a EAccount. (i.e. not an
// on-chain account)
export type MsgContact = EmailContact | PhoneNumberContact;

// Get a unique key for a DaimoContact, used for component key.
// EAccounts are unique by address, emails and phone numbers are unique by
// email or phone number, guaranteed by our systemContacts search function.
export function getDaimoContactKey(contact: DaimoContact): string {
  switch (contact.type) {
    case "eAcc":
      return contact.addr;
    case "email":
      return contact.email;
    case "phoneNumber":
      return contact.phoneNumber;
    case "landlineBankAccount":
      return contact.addr;
  }
}

/** Convert EAccount to EAccountContact */
export function addLastTransferTimes(
  account: Account,
  otherEAcc: EAccount | EAccountSearchResult
): EAccountContact {
  const transfersNewToOld = account.recentTransfers.slice().reverse();
  const lastSendTime = transfersNewToOld.find(
    (t) => t.from === account.address && t.to === otherEAcc.addr
  )?.timestamp;
  const lastRecvTime = transfersNewToOld.find(
    (t) => t.to === account.address && t.from === otherEAcc.addr
  )?.timestamp;
  return { type: "eAcc", ...otherEAcc, lastSendTime, lastRecvTime };
}

export function getContactName(r: DaimoContact, locale?: Locale) {
  if (r.type === "eAcc") return getAccountName(r, locale);
  else if (r.type === "email") return r.name ? r.name : r.email;
  else if (r.type === "phoneNumber") return r.name ? r.name : r.phoneNumber;
  else if (r.type === "landlineBankAccount")
    return `${r.bankName} ****${r.accountNumberLastFour}`;
  else throw new Error(`Unknown recipient type ${r}`);
}

export function getContactProfilePicture(
  r: DaimoContact
): string | { uri: string } | undefined {
  if (r.type === "eAcc") {
    return r.profilePicture;
  } else if (r.type === "landlineBankAccount") {
    const defaultLogo = IconDepositWallet;
    // The bank logo is fetched as a base64 string for a png
    const logo = r.bankLogo
      ? { uri: `data:image/png;base64,${r.bankLogo}` }
      : defaultLogo;
    return logo;
  } else {
    return undefined;
  }
}

export function canSendToContact(otherContact: DaimoContact): boolean {
  if (otherContact.type === "landlineBankAccount") {
    return true;
  } else if (otherContact.type === "eAcc") {
    return canSendTo(otherContact as EAccount);
  } else {
    return false;
  }
}

export function useContactSearch(
  account: Account,
  prefix: string,
  searchContacts: boolean,
  onlyNamedEAccs: boolean
) {
  prefix = prefix.toLowerCase();

  // Load recent recipients (addrs we've sent $ to) & senders (...received from)
  const recents = [] as EAccountContact[];
  const recentsByAddr = new Map<Address, EAccountContact>();
  const transfersNewToOld = account.recentTransfers.slice().reverse();
  for (const t of transfersNewToOld) {
    const other = (function () {
      if (t.from === account.address) {
        return t.type === "createLink" ? t.noteStatus.claimer?.addr : t.to;
      } else if (t.to === account.address) {
        return t.type === "claimLink" ? t.noteStatus.sender.addr : t.from;
      }
    })();
    if (other == null || other === account.address) continue;
    if (recentsByAddr.has(other)) continue;

    const acc = getCachedEAccount(other);

    if (onlyNamedEAccs && !acc.name) continue;

    // HACK: ignore transfers to specially labelled addresses like "payment link"
    // TODO: label transfers by whether occurred as part of a send or a different transaction; ignore the latter
    // TODO: show note claimer as recipient.
    if (acc.label != null) continue;

    const r = addLastTransferTimes(account, acc);
    recents.push(r);
    recentsByAddr.set(other, r);
  }

  // Always show recent contacts first
  const recipients: DaimoContact[] = [];
  const looseMatchRecents: DaimoContact[] = [];
  for (const r of recents) {
    const name = getContactName(r).toLowerCase();
    if (prefix === "") {
      recipients.push(r); // Show ALL recent recipients
    } else if (name.startsWith(prefix)) {
      recipients.push(r); // Show prefix-matching-name recent recipients
    } else if (prefix.length >= 3 && name.includes(prefix)) {
      looseMatchRecents.push(r); // Show matching-name recent recipients
    }
  }
  if (recipients.length === 0) recipients.push(...looseMatchRecents);

  // If we have a valid phone number or email prefix, show it as a recipient
  if (zEmailAddress.safeParse(prefix).success) {
    recipients.push({ type: "email", email: prefix });
  }

  if (zPhoneNumber.safeParse(prefix).success) {
    recipients.push({ type: "phoneNumber", phoneNumber: prefix });
  }

  // Search if we have a prefix. Anyone we've already sent to appears first.
  // Otherwise, just show recent recipients.
  const enabled = prefix.length >= 1;
  const rpcHook = getRpcHook(daimoChainFromId(account.homeChainId));
  const res = rpcHook.search.useQuery({ prefix }, { enabled });
  if (res.data) {
    for (const account of res.data) {
      if (recipients.find((r) => r.type === "eAcc" && r.addr === account.addr))
        continue;
      if (onlyNamedEAccs && !account.name) continue;

      // Even if we didn't match a given recent above ^, may still be a result.
      const recent = recentsByAddr.get(account.addr);
      if (recent) {
        recipients.push({ ...recent, originalMatch: account.originalMatch });
      } else {
        recipients.push({ type: "eAcc", ...account });
      }
    }
    const sortKey = (r: DaimoContact) =>
      Math.max(r.lastSendTime || 0, r.lastRecvTime || 0);
    recipients.sort((a, b) => sortKey(b) - sortKey(a));
  }

  // Search contacts by name
  const systemContacts = useSystemContactsSearch(
    prefix,
    searchContacts && enabled
  );

  if (systemContacts.length > 0) {
    recipients.push(...systemContacts);
  }

  return {
    isSearching: enabled,
    recipients: recipients.slice(0, 16),
    status: res.status,
    error: res.error,
  };
}

export function eAccToContact(eAcc: EAccount): EAccountContact {
  return { type: "eAcc", ...eAcc };
}

function eAccAddrToContact(addr: Address): EAccountContact {
  const eAcc = getCachedEAccount(addr);
  return eAccToContact(eAcc);
}

export function landlineAccountToContact(
  landlineAccount: LandlineAccount
): LandlineBankAccountContact {
  return {
    type: "landlineBankAccount",
    landlineAccountUuid: landlineAccount.landlineAccountUuid,
    addr: landlineAccount.liquidationAddress,
    bankName: landlineAccount.bankName,
    accountNumberLastFour: landlineAccount.accountNumberLastFour,
    bankLogo: landlineAccount.bankLogo,
  };
}

function landlineAccountUuidToContact(
  landlineAccountUuid: string
): LandlineBankAccountContact | null {
  const account = getCachedLandlineAccount(landlineAccountUuid);
  if (!account) return null;
  return landlineAccountToContact(account);
}

export function getTransferClogContact(
  transferClog: TransferClog,
  accountAddress: Address
): LandlineBankAccountContact | EAccountContact {
  if (getTransferClogType(transferClog) === "landline") {
    const { accountID } = (transferClog as TransferSwapClog).offchainTransfer!;
    const llContact = landlineAccountUuidToContact(accountID);
    if (llContact) return llContact;
  }

  const [from, to] = getDisplayFromTo(transferClog);
  return eAccAddrToContact(from === accountAddress ? to : from);
}
