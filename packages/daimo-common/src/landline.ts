import { DaimoChain } from "@daimo/contract";
import { Address, Hex, parseUnits } from "viem";

import {
  OffchainTransfer,
  OpStatus,
  TransferClog,
  TransferSwapClog,
} from "./op";
import { dateStringToUnixSeconds, guessNumFromTimestamp } from "./time";

export interface LandlineAccount {
  daimoAddress: Address;
  landlineAccountUuid: string;
  bankName: string;
  bankLogo: string | null;
  accountName: string;
  accountNumberLastFour: string;
  bankCurrency: string;
  liquidationAddress: Address;
  liquidationChain: string;
  liquidationCurrency: string;
  createdAt: string;
}

export enum LandlineTransferStatus {
  Processing = "processing",
  Completed = "completed",
  Failed = "failed",
  Returned = "returned",
}

export enum LandlineTransferType {
  Deposit = "deposit",
  Withdrawal = "withdrawal",
}

export interface LandlineTransfer {
  daimoAddress: Address;
  transferUuid: string;
  landlineAccountUuid: string;

  bankName: string;
  bankLogo: string | null;
  accountName: string;
  accountType: string | null;
  accountNumberLastFour: string;
  bankCurrency: string | null;
  liquidationAddress: Address;

  fromAddress: Address | null;
  fromChain: string | null;
  toAddress: Address | null;
  toChain: string | null;

  type: LandlineTransferType;
  amount: string;
  memo: string | null;

  txHash: Hex | null;
  status: LandlineTransferStatus;
  statusMessage: string | null;

  createdAt: string;
  estimatedClearingDate: string | null;
  completedAt: string | null;
}

/** Returns eg "Chase ****1234" */
export function getLandlineAccountName(
  landlineAccount: LandlineAccount
): string {
  return `${landlineAccount.bankName} ****${landlineAccount.accountNumberLastFour}`;
}

export function landlineTransferToOffchainTransfer(
  landlineTransfer: LandlineTransfer
): OffchainTransfer {
  const offchainTransfer: OffchainTransfer = {
    type: "landline",
    transferType: landlineTransfer.type,
    status: landlineTransfer.status,
    statusMessage: landlineTransfer.statusMessage ?? undefined,
    accountID: landlineTransfer.landlineAccountUuid,
    transferID: landlineTransfer.transferUuid,
    timeStart: dateStringToUnixSeconds(landlineTransfer.createdAt),
    timeExpected: landlineTransfer.estimatedClearingDate
      ? dateStringToUnixSeconds(landlineTransfer.estimatedClearingDate)
      : undefined,
    timeFinish: landlineTransfer.completedAt
      ? dateStringToUnixSeconds(landlineTransfer.completedAt)
      : undefined,
  };

  return offchainTransfer;
}

export function landlineTransferToTransferClog(
  landlineTransfer: LandlineTransfer,
  chain: DaimoChain
): TransferClog {
  // Default to a Coinbase address so that old versions of the mobile app will
  // show coinbase as the sender for landline deposits
  const DEFAULT_LANDLINE_ADDRESS = "0x1985EA6E9c68E1C272d8209f3B478AC2Fdb25c87";

  const timestamp = dateStringToUnixSeconds(landlineTransfer.createdAt);
  const offchainTransfer = landlineTransferToOffchainTransfer(landlineTransfer);

  const transferClog: TransferSwapClog = {
    timestamp,
    // Set status as confirmed otherwise old versions of the app will
    // clear the pending transfer after a while
    status: OpStatus.confirmed,
    txHash: landlineTransfer.txHash || undefined,
    // blockNumber and logIndex need to be set because old versions of the
    // mobile app use blockNumber and logIndex to sort TransferClogs. Block
    // number is also used to determine finalized transfers.
    blockNumber: guessNumFromTimestamp(timestamp, chain),
    logIndex: 0,

    type: "transfer",
    from: landlineTransfer.fromAddress || DEFAULT_LANDLINE_ADDRESS,
    to: landlineTransfer.toAddress || DEFAULT_LANDLINE_ADDRESS,
    amount: Number(parseUnits(landlineTransfer.amount, 6)),
    memo: landlineTransfer.memo || undefined,
    offchainTransfer,
  };

  return transferClog;
}
