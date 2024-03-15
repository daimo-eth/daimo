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
    deviceAttestationString: Hex
  ): Promise<boolean> {
    const isFaucetAttestationUsed = await this.db.isFaucetAttestationUsed(
      deviceAttestationString
    );

    if (isFaucetAttestationUsed) {
      console.log(
        `[INVITE] faucet attestation ${JSON.stringify(
          code
        )} ${deviceAttestationString} already used`
      );

      // Exit if mainnet double claim is attempted.
      if (!chainConfig.chainL2.testnet) return false;
    }

    // Try sending bonus
    if (code.bonusDollarsInvitee > 0) {
      console.log(
        `[INVITE] sending faucet to invitee ${invitee} ${code.bonusDollarsInvitee}`
      );
      await this.trySendUSDC(invitee, code.bonusDollarsInvitee);
    }
    if (code.inviter && code.bonusDollarsInviter > 0) {
      console.log(
        `[INVITE] sending faucet to inviter ${code.inviter} ${code.bonusDollarsInviter}`
      );
      await this.trySendUSDC(code.inviter, code.bonusDollarsInviter);
    }

    await this.db.insertFaucetAttestation(deviceAttestationString);

    return true;
  }

  // Try sending USDC to an address. Prints error if unsuccessful.
  async trySendUSDC(to: Address, dollars: number) {
    try {
      await this.vc.writeContract({
        abi: erc20ABI,
        address: chainConfig.tokenAddress,
        functionName: "transfer",
        args: [to, dollarsToAmount(dollars)],
      });
    } catch (e) {
      console.log(`[INVITE] failed to send USDC to ${to}: ${e}`);
    }
  }

  // Increment an invite's usage count, if it's valid and not yet used,
  // and perform faucet request for invitee and inviter, if applicable.
  async useInviteCode(
    invitee: Address,
    deviceAttestationString: Hex,
    invCode: string,
    maybeSendFaucet: boolean
  ): Promise<boolean> {
    await retryBackoff(`incrementInviteCodeUseCount`, () =>
      this.db.incrementInviteCodeUseCount(invCode)
    );
    const code = await retryBackoff(`loadInviteCode`, () =>
      this.db.loadInviteCode(invCode)
    );

    if (code != null && code.useCount <= code.maxUses) {
      const faucetStatus = maybeSendFaucet
        ? await this.requestFaucet(invitee, code, deviceAttestationString)
        : "SKIPPED";

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

    const usesLeft = code ? code.maxUses - code.useCount : 0;
    const inviter = code?.inviter
      ? await this.nameReg.getEAccount(code.inviter)
      : undefined;

    console.log(
      `[INVITE] getInvCodeStatus ${JSON.stringify({ code, usesLeft, inviter })}`
    );
    return {
      link: inviteLink,
      isValid: usesLeft > 0,
      usesLeft,
      bonusDollarsInvitee: code?.bonusDollarsInvitee || 0,
      bonusDollarsInviter: code?.bonusDollarsInviter || 0,
      inviter,
    };
  }

  async getBestInviteCodeForSender(
    sender: Address
  ): Promise<string | undefined> {
    return await retryBackoff(`getBestInviteCodeForSender`, () =>
      this.db.getBestInviteCodeForSender(sender)
    );
  }
}
