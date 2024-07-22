import { Address } from "viem";

import { landlineTrpc } from "./trpc";

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

export async function getLandlineSession(
  daimoAddress: Address
): Promise<string> {
  // @ts-ignore
  const sessionKey = await landlineTrpc.getOrCreateSessionKey.mutate({
    daimoAddress,
  });
  return sessionKey;
}

export async function getLandlineAccounts(
  daimoAddress: Address
): Promise<LandlineAccount[]> {
  const landlineAccounts =
    // @ts-ignore
    await landlineTrpc.getExternalAccountsTransferInfo.query({
      daimoAddress,
    });
  return landlineAccounts;
}

export async function landlineDeposit(
  daimoAddress: Address,
  landlineAccountUuid: string,
  amount: string,
  memo: string | undefined
): Promise<void> {
  // @ts-ignore
  await landlineTrpc.deposit.mutate({
    daimoAddress,
    landlineAccountUuid,
    amount,
    memo,
  });
}
