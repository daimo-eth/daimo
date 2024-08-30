import { Address, Hex } from "viem";

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

  createdAt: string;
  estimatedClearingDate: string | null;
  completedAt: string | null;
}

export function getLandlineAccountName(
  landlineAccount: LandlineAccount
): string {
  return `${landlineAccount.bankName} ****${landlineAccount.accountNumberLastFour}`;
}
