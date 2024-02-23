import {
  DaimoLink,
  DaimoNoteStatus,
  assert,
  formatDaimoLink,
  getNoteClaimSignatureFromSeed,
} from "@daimo/common";
import { DaimoChain } from "@daimo/contract";
import { useEffect } from "react";

import { ActHandle, useActStatus } from "./actStatus";
import { DeviceKeyStatus } from "./key";
import { env } from "../logic/env";
import {
  createEmptyAccount,
  defaultEnclaveKeyName,
  useAccount,
} from "../model/account";

/** Deploys a new contract wallet and registers it under a given username. */
export function useCreateAccount(
  name: string,
  inviteLink: DaimoLink | undefined,
  daimoChain: DaimoChain,
  keyStatus: DeviceKeyStatus,
  deviceAPIKeyStatus: DeviceKeyStatus
): ActHandle {
  const [as, setAS] = useActStatus("useCreateAccount");

  const { rpcFunc, rpcHook } = env(daimoChain);

  // Strip seed from link
  const sanitisedInviteLink = inviteLink
    ? formatDaimoLink(inviteLink).split("#")[0]
    : undefined;

  // On exec, create contract onchain, claiming name.
  const result = rpcHook.deployWallet.useMutation();
  const exec = async () => {
    if (
      !keyStatus.pubKeyHex ||
      !deviceAPIKeyStatus.pubKeyHex ||
      !sanitisedInviteLink
    ) {
      console.log(
        `[CREATE] missing data for useCreateAccount ${keyStatus} ${deviceAPIKeyStatus} ${sanitisedInviteLink}`
      );
      setAS("error", "Missing data");
      return;
    }
    setAS("loading", "Creating account...");
    result.mutate({
      name,
      pubKeyHex: keyStatus.pubKeyHex,
      inviteLink: sanitisedInviteLink,
      deviceAttestationString: deviceAPIKeyStatus.pubKeyHex,
    });
  };

  const reset = () => {
    console.log(`[CREATE] resetting useCreateAccount`);
    result.reset();
    setAS("idle");
  };

  // Set account status if key status changes
  useEffect(() => {
    setAS(keyStatus.status, keyStatus.message);
  }, [keyStatus.status]);

  // Once account creation succeeds, save the account
  const [account, setAccount] = useAccount();
  useEffect(() => {
    // Ignore if idle, loading, or already done
    if (account) return;
    if (["idle", "loading"].includes(result.status)) return;
    if (!result.variables || !result.variables.name) return;
    if (!keyStatus.pubKeyHex) return;

    // RPC failed, offline?
    if (result.status === "error") {
      setAS("error", result.error.message);
      return;
    }
    assert(result.status === "success");

    // RPC succeeded but transaction reverted
    if (result.data.status !== "success") {
      assert(result.data.status === "reverted");
      setAS("error", "Account creation reverted");
      return;
    }

    // Success
    const { name } = result.variables;
    const { address } = result.data;
    console.log(`[CHAIN] created new account ${name} at ${address}`);
    setAccount(
      createEmptyAccount(
        {
          enclaveKeyName: defaultEnclaveKeyName,
          enclavePubKey: keyStatus.pubKeyHex,
          name,
          address,
        },
        daimoChain
      )
    );
    setAS("success", "Account created");

    // In background, claim payment link
    if (sanitisedInviteLink && inviteLink?.type === "notev2") {
      const claimNote = async () => {
        const noteStatus = (await rpcFunc.getLinkStatus.query({
          url: sanitisedInviteLink,
        })) as DaimoNoteStatus;

        const ephemeralSignature = await getNoteClaimSignatureFromSeed(
          noteStatus.sender.addr,
          address,
          inviteLink.seed
        );
        const claimTxHash = await rpcFunc.claimEphemeralNoteSponsored.mutate({
          ephemeralOwner: noteStatus.ephemeralOwner!,
          recipient: address,
          signature: ephemeralSignature,
        });

        console.log(`[CREATE] Claimed note in background: ${claimTxHash}`);
      };
      claimNote().catch((e) =>
        console.error(`[CREATE] error claiming note`, e)
      );
    }
  }, [result.isSuccess, result.isError]);

  return { ...as, exec, reset, cost: { feeDollars: 0, totalDollars: 0 } };
}
