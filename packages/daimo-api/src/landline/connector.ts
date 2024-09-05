import { LandlineAccount, LandlineTransfer } from "@daimo/common";
import { Address } from "viem";

import { landlineTrpc } from "./trpc";
import { getEnvApi } from "../env";

export interface LandlineSessionKey {
  key: string;
}

export interface LandlineDepositResponse {
  status: string;
  transfer?: LandlineTransfer;
  error?: string;
}

export function getLandlineURL(daimoAddress: string, sessionKey: string) {
  const landlineDomain = getEnvApi().LANDLINE_DOMAIN;
  const url = `${landlineDomain}?daimoAddress=${daimoAddress}&sessionKey=${sessionKey}`;
  return url;
}

export async function getLandlineSession(
  daimoAddress: Address
): Promise<LandlineSessionKey> {
  console.log(`[LANDLINE] getting session key for ${daimoAddress}`);

  try {
    // @ts-ignore
    const sessionKey = await landlineTrpc.getOrCreateSessionKey.mutate({
      daimoAddress,
    });
    console.log(`[LANDLINE] got session key for ${daimoAddress}`);
    return sessionKey;
  } catch (err: any) {
    console.error(
      `[LANDLINE] error getting session key for ${daimoAddress}`,
      err
    );
    // Gracefully return empty string
    return { key: "" };
  }
}

export async function getLandlineAccounts(
  daimoAddress: Address
): Promise<LandlineAccount[]> {
  console.log(`[LANDLINE] getting external accounts for ${daimoAddress}`);

  try {
    const landlineAccounts =
      // @ts-ignore
      await landlineTrpc.getExternalAccountsTransferInfo.query({
        daimoAddress,
      });
    console.log(`[LANDLINE] got external accounts for ${daimoAddress}`);
    // TODO: change to number. Currently a string for backcompat
    return landlineAccounts.map((account: any) => ({
      ...account,
      createdAt: new Date(account.createdAt).toISOString(),
    }));
  } catch (err: any) {
    console.error(
      `[LANDLINE] error getting external accounts for ${daimoAddress}`,
      err
    );
    // Gracefully return empty array
    return [];
  }
}

export async function getLandlineTransfers(
  daimoAddress: Address,
  createdAfter?: number
): Promise<LandlineTransfer[]> {
  // Convert createdAfter from Unix seconds to a Date object if it's provided
  const createdAfterDate = createdAfter
    ? new Date(createdAfter * 1000)
    : undefined;

  const transfers =
    // @ts-ignore
    await landlineTrpc.getAllLandlineTransfers.query({
      daimoAddress,
      createdAfter: createdAfterDate,
    });
  return transfers;
}

export async function landlineDeposit(
  daimoAddress: Address,
  landlineAccountUuid: string,
  amount: string,
  memo: string | undefined
): Promise<LandlineDepositResponse> {
  console.log("[LANDLINE] making deposit", {
    daimoAddress,
    landlineAccountUuid,
    amount,
    memo,
  });

  try {
    // @ts-ignore
    const depositResponse = await landlineTrpc.deposit.mutate({
      daimoAddress,
      landlineAccountUuid,
      amount,
      memo,
    });
    console.log(
      `[LANDLINE] created deposit for ${daimoAddress}, landlineAccountUuid: ${landlineAccountUuid}, amount: ${amount}, memo: ${memo}`,
      depositResponse
    );
    return depositResponse;
  } catch (err: any) {
    console.error(`[LANDLINE] error making deposit`, err);
    // Gracefully return error status
    return { status: "error" };
  }
}
