import { dollarsToAmount } from "@daimo/common";
import { erc20ABI } from "@daimo/contract";
import { Address, Hex } from "viem";

import { DB } from "../db/db";
import { chainConfig } from "../env";
import { ViemClient } from "../network/viemClient";
import { retryBackoff } from "../utils/retryBackoff";

/** Invite codes. Used for client frontend gating and referral bonuses. */
export class InviteCodeTracker {
  constructor(private vc: ViemClient, private db: DB) {}

  async requestFaucet(
    addresses: Address[],
    deviceAttestationString: Hex | undefined,
    dollars: number
  ): Promise<boolean> {
    // TODO: For backwards compatibility, we currently accept the lack of a
    // device attestation string. This should be disabled in future when clients
    // are up to date and expected to send one.
    const isFaucetAttestationUsed = deviceAttestationString
      ? await this.db.isFaucetAttestationUsed(deviceAttestationString)
      : false;

    if (isFaucetAttestationUsed) {
      console.log(
        `[INVITE] faucet attestation ${addresses} ${deviceAttestationString} already used`
      );

      // Exit if mainnet double claim is attempted.
      if (!chainConfig.chainL2.testnet) return false;
    }

    console.log(`[INVITE] sending $${dollars} USDC to ${addresses}`);

    await Promise.all(
      addresses.map((address) =>
        this.vc.writeContract({
          abi: erc20ABI,
          address: chainConfig.tokenAddress,
          functionName: "transfer",
          args: [address, dollarsToAmount(dollars)],
        })
      )
    );

    if (deviceAttestationString) {
      await this.db.insertFaucetAttestation(deviceAttestationString);
    }

    return true;
  }

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
      if (code.bonusDollars > 0) {
        const bonusAddresses = [invitee].concat(code.inviter || []);
        const faucetStatus = await this.requestFaucet(
          bonusAddresses,
          deviceAttestationString,
          code.bonusDollars
        );

        console.log(`[INVITE] faucet status: ${faucetStatus}`);
      }

      // Regardless of faucet status, we let the user in.
      return true;
    } else return false;
  }

  async getInviteCodeStatus(invCode: string): Promise<{
    isValid: boolean;
    bonusDollars: number;
    senderAddress?: Address;
  }> {
    const code = await retryBackoff(`loadInviteCode`, () =>
      this.db.loadInviteCode(invCode)
    );

    const isValid = code ? code.useCount < code.maxUses : false;
    return {
      isValid,
      bonusDollars: code?.bonusDollars || 0,
      senderAddress: code?.inviter || undefined,
    };
  }
}
