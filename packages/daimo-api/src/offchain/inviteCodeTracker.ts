import {
  DaimoInviteCodeStatus,
  DaimoLinkInviteCode,
  dollarsToAmount,
} from "@daimo/common";
import { erc20ABI } from "@daimo/contract";
import { Address, Hex } from "viem";

import { NameRegistry } from "../contract/nameRegistry";
import { DB, InviteCodeRow } from "../db/db";
import { chainConfig } from "../env";
import { ViemClient } from "../network/viemClient";
import { retryBackoff } from "../utils/retryBackoff";

/** Invite codes. Used for invite gating the app and referral bonuses. */
export class InviteCodeTracker {
  constructor(
    private vc: ViemClient,
    private nameReg: NameRegistry,
    private db: DB
  ) {}

  // Perform faucet request for invitee and inviter of a given invite code,
  // if applicable, and record the device attestation string used by invitee
  // to prevent griefing.
  async requestFaucet(
    invitee: Address,
    code: InviteCodeRow,
    deviceAttestationString: Hex | undefined
  ): Promise<boolean> {
    // TODO: For backwards compatibility, we currently accept the lack of a
    // device attestation string. This should be disabled in future when clients
    // are up to date and expected to send one.
    const isFaucetAttestationUsed = deviceAttestationString
      ? await this.db.isFaucetAttestationUsed(deviceAttestationString)
      : false;

    if (isFaucetAttestationUsed) {
      console.log(
        `[INVITE] faucet attestation ${code} ${deviceAttestationString} already used`
      );

      // Exit if mainnet double claim is attempted.
      if (!chainConfig.chainL2.testnet) return false;
    }

    await Promise.all([
      () => {
        if (code.bonusDollarsInvitee === 0) return;
        console.log(
          `[INVITE] sending faucet to invitee ${invitee} ${code.bonusDollarsInvitee}`
        );
        this.vc.writeContract({
          abi: erc20ABI,
          address: chainConfig.tokenAddress,
          functionName: "transfer",
          args: [invitee, dollarsToAmount(code.bonusDollarsInvitee)],
        });
      },
      () => {
        if (!code.inviter || code.bonusDollarsInviter === 0) return;
        console.log(
          `[INVITE] sending faucet to inviter ${code.inviter} ${code.bonusDollarsInviter}`
        );
        this.vc.writeContract({
          abi: erc20ABI,
          address: chainConfig.tokenAddress,
          functionName: "transfer",
          args: [code.inviter, dollarsToAmount(code.bonusDollarsInviter)],
        });
      },
    ]);

    if (deviceAttestationString) {
      await this.db.insertFaucetAttestation(deviceAttestationString);
    }

    return true;
  }

  // Increment an invite's usage count, if it's valid and not yet used,
  // and perform faucet request for invitee and inviter, if applicable.
  async useInviteCode(
    invitee: Address,
    deviceAttestationString: Hex | undefined,
    invCode: string
  ): Promise<boolean> {
    await retryBackoff(`incrementInviteCodeUseCount`, () =>
      this.db.incrementInviteCodeUseCount(invCode)
    );
    const code = await retryBackoff(`loadInviteCode`, () =>
      this.db.loadInviteCode(invCode)
    );

    if (code != null && code.useCount <= code.maxUses) {
      const faucetStatus = await this.requestFaucet(
        invitee,
        code,
        deviceAttestationString
      );

      console.log(`[INVITE] faucet status: ${faucetStatus}`);

      // Regardless of faucet status, we let the user in.
      return true;
    } else return false;
  }

  async getInviteCodeStatus(
    inviteLink: DaimoLinkInviteCode
  ): Promise<DaimoInviteCodeStatus> {
    const code = await retryBackoff(`loadInviteCode`, () =>
      this.db.loadInviteCode(inviteLink.code)
    );

    const isValid = code ? code.useCount < code.maxUses : false;
    const inviter = code?.inviter
      ? await this.nameReg.getEAccount(code.inviter)
      : undefined;
    return {
      link: inviteLink,
      isValid,
      bonusDollarsInvitee: code?.bonusDollarsInvitee || 0,
      bonusDollarsInviter: code?.bonusDollarsInviter || 0,
      inviter,
    };
  }
}
