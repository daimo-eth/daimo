import { LandlineAccount, LandlineTransfer, debugJson } from "@daimo/common";
import { Address } from "viem";

import { landlineTrpc } from "./trpc";
import { getEnvApi } from "../env";
import { TrpcRequestContext } from "../server/trpc";

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
  {
    daimoAddress,
  }: {
    daimoAddress: Address;
  },
  context: TrpcRequestContext
): Promise<LandlineSessionKey> {
  console.log(`[LANDLINE] getting session key for ${daimoAddress}`);

  try {
    // @ts-ignore
    const sessionKey = await landlineTrpc.getOrCreateSessionKey.mutate(
      {
        daimoAddress,
      },
      {
        context,
      }
    );
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
  {
    daimoAddress,
  }: {
    daimoAddress: Address;
  },
  context: TrpcRequestContext
): Promise<LandlineAccount[]> {
  console.log(`[LANDLINE] getting external accounts for ${daimoAddress}`);

  try {
    const landlineAccounts =
      // @ts-ignore
      await landlineTrpc.getExternalAccountsTransferInfo.query(
        {
          daimoAddress,
        },
        {
          context,
        }
      );
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
  {
    daimoAddress,
    createdAfterS,
  }: {
    daimoAddress: Address;
    createdAfterS?: number;
  },
  context: TrpcRequestContext
): Promise<LandlineTransfer[]> {
  // Convert createdAfter from Unix seconds to a Date object if it's provided
  const createdAfter = createdAfterS
    ? new Date(createdAfterS * 1000)
    : undefined;

  const transfers =
    // @ts-ignore
    await landlineTrpc.getAllLandlineTransfers.query(
      {
        daimoAddress,
        createdAfter,
      },
      {
        context,
      }
    );
  return transfers;
}

export async function landlineDeposit(
  {
    daimoAddress,
    landlineAccountUuid,
    amount,
    memo,
  }: {
    daimoAddress: Address;
    landlineAccountUuid: string;
    amount: string;
    memo?: string;
  },
  context: TrpcRequestContext
): Promise<LandlineDepositResponse> {
  console.log("[LANDLINE] making deposit", {
    daimoAddress,
    landlineAccountUuid,
    amount,
    memo,
  });

  try {
    // @ts-ignore
    const depositResponse = await landlineTrpc.deposit.mutate(
      {
        daimoAddress,
        landlineAccountUuid,
        amount,
        memo,
      },
      {
        context,
      }
    );
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

// TODO: remove all duplicate types across repos
export type FastFinishRejectReason = "tx-limit" | "monthly-limit";
export type ShouldFastFinishResponse = {
  shouldFastFinish: boolean;
  reason: FastFinishRejectReason | null;
};

/**
 * Performs any necessary validations before initiating a Landline deposit.
 * @param daimoAddress destination address of the deposit (Daimo account)
 * @param amount amount in the units of the destination token (USDC)
 * @returns
 */
export async function validateLandlineDeposit(
  args: {
    daimoAddress: Address;
    amount: string;
  },
  context: TrpcRequestContext
) {
  console.log(`[LANDLINE] validating deposit ${debugJson(args)}`);
  try {
    const response: ShouldFastFinishResponse =
      // @ts-ignore
      await landlineTrpc.shouldFastDeposit.query(
        {
          daimoAddress: args.daimoAddress,
          amount: args.amount,
        },
        {
          context,
        }
      );
    console.log(
      `[LANDLINE] validateLandlineDeposit ${debugJson({ args, response })}`
    );
    return response;
  } catch (err: any) {
    throw new Error("[LANDLINE] error validating deposit", err);
  }
}
