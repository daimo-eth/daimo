import {
  DaimoInviteCodeStatus,
  DisplayOpEvent,
  EAccount,
  OpEvent,
  PendingOpEvent,
  assert,
  dollarsToAmount,
  now,
} from "@daimo/common";
import { DaimoOpSender } from "@daimo/userop";
import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { Address } from "viem";

import { ActHandle, SetActStatus, useActStatus } from "./actStatus";
import { getAccountManager, useAccount } from "../logic/accountManager";
import { getWrappedDeviceKeySigner } from "../logic/key";
import { NamedError } from "../logic/log";
import { loadOpSender } from "../logic/opSender";
import { DeviceKeySigner, Signer } from "../logic/signer";
import { Account } from "../storage/account";

/** Send a user op, returning the userOpHash. */
type SendOpFn = (opSender: DaimoOpSender) => Promise<PendingOpEvent>;

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
  signer?: Signer;
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

export function useSendWithDeviceKeyAsync(args: UseSendArgs) {
  const deviceAccount = useAccount();

  const keySlot = deviceAccount
    ? deviceAccount.accountKeys.find(
        (k) => k.pubKey === deviceAccount.enclavePubKey
      )?.slot
    : undefined;

  const signer =
    keySlot !== undefined && deviceAccount
      ? ({
          type: "deviceKey",
          keySlot,
          wrappedSigner: getWrappedDeviceKeySigner(
            deviceAccount.enclaveKeyName,
            keySlot
          ),
          account: deviceAccount,
        } as DeviceKeySigner)
      : undefined;

  return useSendAsync({ ...args, signer });
}

/** Send a user op, track status. */
export function useSendAsync({
  dollarsToSend,
  sendFn,
  customHandler,
  pendingOp,
  accountTransform,
  signer,
}: UseSendArgs): UserOpHandle {
  const [as, setAS] = useActStatus("useSendAsync");

  const account = signer ? signer.account : null;

  const feeDollars = account?.chainGasConstants.estimatedFee || 0;
  const cost = { feeDollars, totalDollars: dollarsToSend + feeDollars };

  const exec = useCallback(async () => {
    console.log(
      `[SEND] sending userOp. account: ${account?.name}, signer: ${signer?.type}, total cost: $${cost.totalDollars}`
    );
    assert(account != null, "No account");

    const pendingOpEventData = customHandler
      ? await customHandler(setAS)
      : await sendAsync(setAS, account, signer, sendFn);

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
  }, [account, signer, sendFn]);

  return { ...as, exec, cost };
}

/** Regular transfer / payment link account transform. Adds pending
 *  transfer to history and merges any new named accounts. */
export function transferAccountTransform(namedAccounts: EAccount[]) {
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
          createdAt: now(),
        }
      : null;

  return {
    ...account,
    inviteLinkStatus,
  };
}

async function sendAsync(
  setAS: SetActStatus,
  account: Account,
  signer: Signer | undefined,
  sendFn: SendOpFn
): Promise<PendingOpEvent> {
  try {
    const { address, homeChainId } = account;

    if (!signer) {
      setAS("error", "Device removed from account");
      throw new Error("Device removed from account");
    }

    setAS("loading", "Loading account..."); // "account" is shown in the UI, internally it's the op sender.
    const opSender = await loadOpSender({
      address,
      signer,
      chainId: homeChainId,
    });

    setAS("loading", "Authorizing...");
    const pendingOpEventData = await sendFn(opSender);
    setAS("success", "Accepted");

    return pendingOpEventData;
  } catch (e: any) {
    if (
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
