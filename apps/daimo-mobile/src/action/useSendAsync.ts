import {
  DaimoInviteCodeStatus,
  DisplayOpEvent,
  EAccount,
  OpEvent,
  PendingOpEvent,
  UserOpHex,
  assert,
  assertNotNull,
  dollarsToAmount,
  now,
} from "@daimo/common";
import {
  daimoChainFromId,
  notesV1AddressMap,
  notesV2AddressMap,
} from "@daimo/contract";
import { DaimoOpSender, OpSenderCallback } from "@daimo/userop";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect } from "react";
import { Address } from "viem";

import { ActHandle, SetActStatus, useActStatus } from "./actStatus";
import { getAccountManager, useAccount } from "../logic/accountManager";
import { env } from "../logic/env";
import { getWrappedRawSigner } from "../logic/key";
import { NamedError } from "../logic/log";
import { getWrappedPasskeySigner } from "../logic/passkey";
import { Account } from "../model/account";

/** Send a user op, returning the userOpHash. */
type SendOpFn = (opSender: DaimoOpSender) => Promise<PendingOpEvent>;

/** Default send deadline, in seconds. Determines validUntil for each op. */
export const SEND_DEADLINE_SECS = 120;

/** Progress & outcome of a userop. */
interface UserOpHandle extends ActHandle {
  /** Action costs, including fees and total. */
  cost: { feeDollars: number; totalDollars: number };
  /** Should be called only when status is 'idle' */
  exec: () => void;
  /** Should be called only when status is 'success' or 'error' */
  reset?: () => void;
}

// Use discriminated unions to allow transforms without pendingOp.

type BaseUseSendArgs = {
  dollarsToSend: number;
  sendFn: SendOpFn;
  /** Custom handler that overrides sendAsync, used to claim
   *  ephemeral notes without requesting a user signature / face ID.
   */
  customHandler?: (setAS: SetActStatus) => Promise<PendingOpEvent>;
  passkeyAccount?: Account;
};

type UseSendWithPendingOpArgs = BaseUseSendArgs & {
  pendingOp: OpEvent;
  /** Runs on success, before the account is saved */
  accountTransform?: (account: Account, pendingOp: OpEvent) => Account;
};

type UseSendWithoutPendingOpArgs = BaseUseSendArgs & {
  pendingOp?: undefined;
  /** Runs on success, before the account is saved */
  accountTransform?: (account: Account) => Account;
};

type UseSendArgs = UseSendWithPendingOpArgs | UseSendWithoutPendingOpArgs;

/** Send a user op, track status. */
export function useSendAsync({
  dollarsToSend,
  sendFn,
  customHandler,
  pendingOp,
  accountTransform,
  passkeyAccount,
}: UseSendArgs): UserOpHandle {
  const [as, setAS] = useActStatus("useSendAsync");

  const [deviceAccount] = useAccount();
  const account = passkeyAccount || deviceAccount;

  const keySlot = account
    ? account.accountKeys.find(
        (keyData) => keyData.pubKey === account.enclavePubKey
      )?.slot
    : undefined;

  const feeDollars = account?.chainGasConstants.estimatedFee || 0;
  const cost = { feeDollars, totalDollars: dollarsToSend + feeDollars };

  const exec = useCallback(async () => {
    console.log(
      `[SEND] sending userOp. account: ${account?.name}, total cost: $${cost.totalDollars}`
    );
    assert(
      passkeyAccount !== undefined || keySlot != null,
      "No key slot or passkey"
    );
    assert(account != null, "No account");

    const pendingOpEventData = customHandler
      ? await customHandler(setAS)
      : await sendAsync(setAS, account, keySlot, !!passkeyAccount, sendFn);

    // Vibrate on success
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Add pending op and named accounts to history
    if (pendingOp) {
      pendingOp.opHash = pendingOpEventData.opHash;
      pendingOp.txHash = pendingOpEventData.txHash;
      pendingOp.timestamp = now();
      pendingOp.feeAmount = Number(dollarsToAmount(feeDollars));

      getAccountManager().transform((a) => {
        if (accountTransform) a = accountTransform(a, pendingOp);
        return addInviteLinkStatus(a, pendingOpEventData);
      });

      console.log(`[SEND] added pending op ${pendingOp.opHash}`);
    } else if (accountTransform) {
      getAccountManager().transform(accountTransform);
      console.log(`[SEND] updated account with provided transform`);
    }
  }, [account?.enclaveKeyName, keySlot, sendFn]);

  return { ...as, exec, cost };
}

/** Regular transfer / payment link account transform. Adds pending
 *  transfer to history and merges any new named accounts. */
export function transferAccountTransform(
  namedAccounts: EAccount[],
  requestId?: string
) {
  return (account: Account, pendingOp: OpEvent): Account => {
    assert(["transfer", "createLink", "claimLink"].includes(pendingOp.type));
    // Filter to new named accounts only
    const findAccount = (addr: Address) =>
      account.namedAccounts.find((a) => a.addr === addr);

    namedAccounts = namedAccounts.filter((a) => findAccount(a.addr) == null);

    return {
      ...account,
      recentTransfers: [
        ...account.recentTransfers,
        pendingOp as DisplayOpEvent,
      ],
      namedAccounts: [...account.namedAccounts, ...namedAccounts],
      // If sending based on request, remove request from requests list.
      ...(requestId
        ? {
            requests: account.requests.filter(
              (r) => r.request.link.id !== requestId
            ),
          }
        : {}),
    };
  };
}

// Adds invite link status to account
// The invite link status is attached to sendUserOp since being able to send a
// userop successfully authenticates the user to the API.
function addInviteLinkStatus(
  account: Account,
  pendingOpEventData: PendingOpEvent
): Account {
  console.log(
    `[SEND] attaching authenticate invite link status: ${JSON.stringify(
      pendingOpEventData
    )}`
  );
  const inviteLinkStatus: DaimoInviteCodeStatus | null =
    pendingOpEventData.inviteCode
      ? {
          link: { type: "invite", code: pendingOpEventData.inviteCode },
          isValid: false, // initialize false, filled on sync
        }
      : null;

  return {
    ...account,
    inviteLinkStatus,
  };
}

/** Warm the DaimoOpSender cache. */
export function useWarmSenderCache(account: Account) {
  const { enclaveKeyName, address } = account;
  const chainId = account.homeChainId;
  const keySlot = account.accountKeys.find(
    (keyData) => keyData.pubKey === account.enclavePubKey
  )?.slot;

  useEffect(() => {
    if (!enclaveKeyName || !address || !keySlot || !chainId) return;
    loadOpSender({
      enclaveKeyName,
      address,
      keySlot,
      usePasskey: false,
      chainId,
    });
  }, [enclaveKeyName, address, keySlot, chainId]);
}

const accountCache: Map<
  [Address, number | undefined],
  Promise<DaimoOpSender>
> = new Map();

function loadOpSender({
  enclaveKeyName,
  address,
  keySlot,
  usePasskey,
  chainId,
}: {
  enclaveKeyName: string;
  address: Address;
  keySlot: number | undefined;
  usePasskey: boolean;
  chainId: number;
}) {
  assert(
    (keySlot == null) === usePasskey,
    "Key slot and passkey are mutually exclusive"
  );

  let promise = accountCache.get([address, keySlot]);
  if (promise) return promise;

  const daimoChain = daimoChainFromId(chainId);
  const rpcFunc = env(daimoChain).rpcFunc;

  const signer = usePasskey
    ? getWrappedPasskeySigner(daimoChain)
    : getWrappedRawSigner(enclaveKeyName, keySlot!);

  const sender: OpSenderCallback = async (op: UserOpHex, memo?: string) => {
    console.info(`[SEND] sending op ${JSON.stringify(op)}`);
    return rpcFunc.sendUserOpV2.mutate({ op, memo });
  };

  promise = (async () => {
    console.info(
      `[SEND] loading DaimoOpSender ${address} ${enclaveKeyName} ${keySlot}`
    );

    const chainConfig = env(daimoChain).chainConfig;
    return await DaimoOpSender.init({
      chainId,
      tokenAddress: chainConfig.tokenAddress,
      tokenDecimals: chainConfig.tokenDecimals,
      notesAddressV1: assertNotNull(notesV1AddressMap.get(chainId)),
      notesAddressV2: assertNotNull(notesV2AddressMap.get(chainId)),
      accountAddress: address,
      accountSigner: signer,
      opSender: sender,
      deadlineSecs: SEND_DEADLINE_SECS,
    });
  })();
  accountCache.set([address, keySlot], promise);

  return promise;
}

async function sendAsync(
  setAS: SetActStatus,
  account: Account,
  keySlot: number | undefined,
  usePasskey: boolean,
  sendFn: SendOpFn
): Promise<PendingOpEvent> {
  try {
    if (keySlot === undefined && !usePasskey)
      throw new Error("No key slot or passkey");

    const { enclaveKeyName, address, homeChainId } = account;

    setAS("loading", "Loading account...");
    const opSender = await loadOpSender({
      enclaveKeyName,
      address,
      keySlot,
      usePasskey,
      chainId: homeChainId,
    });

    setAS("loading", "Authorizing...");
    const pendingOpEventData = await sendFn(opSender);
    setAS("success", "Accepted");

    return pendingOpEventData;
  } catch (e: any) {
    if (keySlot === undefined) {
      setAS("error", "Device removed from account");
    } else if (
      e instanceof NamedError &&
      ["ExpoEnclaveSign", "ExpoPasskeysCreate", "ExpoPasskeysSign"].includes(
        e.name
      )
    ) {
      setAS("error", e.message);
    } else if (e.message === "Network request failed") {
      setAS("error", "Request failed. Offline?");
    } else {
      setAS("error", "Error sending transaction");
    }
    console.error(`[SEND] error: ${e}`);
    throw e;
  }
}
