import {
  LandlineTransfer,
  OffchainAction,
  OpStatus,
  TransferSwapClog,
  dateStringToUnixSeconds,
  guessNumFromTimestamp,
  landlineTransferToOffchainTransfer,
  now,
  zDollarStr,
} from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { parseUnits, stringToBytes } from "viem";

import { signAsync } from "./sign";
import { ActHandle, useActStatus } from "../action/actStatus";
import { i18n } from "../i18n";
import { getAccountManager } from "../logic/accountManager";
import { getRpcFunc } from "../logic/trpc";
import { Account } from "../storage/account";

const i18 = i18n.landlineDepositButton;

interface UseLandlineDepositArgs {
  account: Account;
  recipient: { landlineAccountUuid: string };
  dollarsStr: string;
  memo?: string;
}

export function useLandlineDeposit({
  account,
  recipient,
  dollarsStr,
  memo,
}: UseLandlineDepositArgs): ActHandle & { exec: () => Promise<void> } {
  const [as, setAS] = useActStatus("useLandlineDeposit");

  const exec = useCallback(async () => {
    console.log(
      `[LANDLINE] Creating deposit for ${account.name} to ${recipient.landlineAccountUuid} for $${dollarsStr}`
    );
    setAS("loading", i18.depositStatus.creating());

    // Make the user sign an offchain action to authenticate the deposit
    const action: OffchainAction = {
      type: "landlineDeposit",
      time: now(),
      landlineAccountUuid: recipient.landlineAccountUuid,
      amount: zDollarStr.parse(dollarsStr),
      memo: memo ?? "",
    };
    const actionJSON = JSON.stringify(action);
    const messageBytes = stringToBytes(actionJSON);
    const signature = await signAsync({ account, messageBytes });

    try {
      const rpcFunc = getRpcFunc(daimoChainFromId(account.homeChainId));
      console.log("[LANDLINE] Making RPC call to depositFromLandline");
      const response = await rpcFunc.depositFromLandline.mutate({
        daimoAddress: account.address,
        actionJSON,
        signature,
      });

      if (response.status === "success") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setAS("success", i18.depositStatus.success());
        getAccountManager().transform((a) => {
          // response.transfer guaranteed to be defined on success
          return depositAccountTransform(a, response.transfer!);
        });
      } else {
        console.error("[LANDLINE] Landline deposit error:", response.error);
        setAS("error", i18.depositStatus.failed());
      }
    } catch (error) {
      console.error("[LANDLINE] Landline deposit error:", error);
      setAS("error", i18.depositStatus.failed());
    }
  }, [account, recipient, dollarsStr, memo, setAS]);

  return { ...as, exec };
}

function depositAccountTransform(
  account: Account,
  landlineTransfer: LandlineTransfer
): Account {
  const offchainTransfer = landlineTransferToOffchainTransfer(landlineTransfer);

  // Use a coinbase address so that old versions of the mobile app will show
  // coinbase as the sender for landline deposits
  const DEFAULT_LANDLINE_ADDRESS = "0x1985EA6E9c68E1C272d8209f3B478AC2Fdb25c87";
  const timestamp = dateStringToUnixSeconds(landlineTransfer.createdAt);

  const transferClog: TransferSwapClog = {
    timestamp,
    // Set status as confirmed otherwise old versions of the app will
    // clear the pending transfer after a while
    status: OpStatus.confirmed,
    txHash: landlineTransfer.txHash || undefined,
    // Old versions of the mobile app use blockNumber and logIndex to sort
    // TransferClogs. Block number is also used to determine finalized transfers.
    blockNumber: guessNumFromTimestamp(
      timestamp,
      daimoChainFromId(account.homeChainId)
    ),
    logIndex: 0,

    type: "transfer",
    from: landlineTransfer.fromAddress || DEFAULT_LANDLINE_ADDRESS,
    to: landlineTransfer.toAddress || DEFAULT_LANDLINE_ADDRESS,
    amount: Number(parseUnits(landlineTransfer.amount, 6)),
    memo: landlineTransfer.memo || undefined,
    offchainTransfer,
  };

  return {
    ...account,
    recentTransfers: [...account.recentTransfers, transferClog],
  };
}
