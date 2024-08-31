import { Address } from "viem";

import { landlineTrpc } from "./trpc";
import { getEnvApi } from "../env";

export interface LandlineSessionKey {
  key: string;
}

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

export interface LandlineDepositResponse {
  status: string;
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
    return landlineAccounts;
  } catch (err: any) {
    console.error(
      `[LANDLINE] error getting external accounts for ${daimoAddress}`,
      err
    );
    // Gracefully return empty array
    return [];
  }
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
