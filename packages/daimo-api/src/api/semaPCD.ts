/// <reference path="../../typings.d.ts" />
import { PCD, PCDArgument, StringArgument } from "@pcd/pcd-types";
import { generateSnarkMessageHash, requireDefinedParameter } from "@pcd/util";
import { Group } from "@semaphore-protocol/group";
import { Identity } from "@semaphore-protocol/identity";
import {
  PackedProof,
  SemaphoreProof,
  verifyProof,
} from "@semaphore-protocol/proof";
import JSONBig from "json-bigint";

/**
 * All signature PCDs are 'namespaced' to this pseudo-random nullifier,
 * so that they cannot be reused by malicious actors across different
 * applications.
 */
export const STATIC_SIGNATURE_PCD_NULLIFIER = generateSnarkMessageHash(
  "hardcoded-nullifier"
);

export const SemaphoreSignaturePCDTypeName = "semaphore-signature-pcd";

export interface SemaphoreSignaturePCDInitArgs {
  zkeyFilePath: string;
  wasmFilePath: string;
}

// We hardcode the externalNullifer to also be your identityCommitment
// so that your nullifier for specific groups is not revealed when
// a SemaphoreSignaturePCD is requested from a consumer application.
export type SemaphoreSignaturePCDArgs = {
  identity: PCDArgument<SemaphoreIdentityPCD>;
  signedMessage: StringArgument;
};

export interface SemaphoreSignaturePCDClaim {
  /**
   * Pre-hashed message.
   */
  signedMessage: string;

  /**
   * Stringified `BigInt`.
   */
  identityCommitment: string;

  /**
   * Stringified `BigInt`.
   */
  nullifierHash: string;
}

export type SemaphoreSignaturePCDProof = PackedProof;
export class SemaphoreSignaturePCD
  implements PCD<SemaphoreSignaturePCDClaim, SemaphoreSignaturePCDProof>
{
  type = SemaphoreSignaturePCDTypeName;
  claim: SemaphoreSignaturePCDClaim;
  proof: SemaphoreSignaturePCDProof;
  id: string;

  public constructor(
    id: string,
    claim: SemaphoreSignaturePCDClaim,
    proof: SemaphoreSignaturePCDProof
  ) {
    this.id = id;
    this.claim = claim;
    this.proof = proof;
  }
}

export class SemaphoreSignaturePCDPackage {
  static async verify(pcd: SemaphoreSignaturePCD): Promise<boolean> {
    // Set up singleton group
    const group = new Group(1, 16);
    group.addMember(pcd.claim.identityCommitment);

    // Convert PCD into Semaphore FullProof
    const fullProof: SemaphoreProof = {
      externalNullifier: STATIC_SIGNATURE_PCD_NULLIFIER.toString(),
      merkleTreeRoot: group.root + "",
      nullifierHash: pcd.claim.nullifierHash,
      proof: pcd.proof,
      signal: generateSnarkMessageHash(pcd.claim.signedMessage).toString(),
    };

    // check if proof is valid
    const validProof = await verifyProof(fullProof, 16);

    return validProof;
  }

  static async deserialize(serialized: string): Promise<SemaphoreSignaturePCD> {
    const { id, claim, proof } = JSONBig().parse(serialized);

    requireDefinedParameter(id, "id");
    requireDefinedParameter(claim, "claim");
    requireDefinedParameter(proof, "proof");

    return new SemaphoreSignaturePCD(id, claim, proof);
  }
}

class SemaphoreIdentityPCD
  implements PCD<SemaphoreIdentityPCDClaim, SemaphoreIdentityPCDProof>
{
  type = SemaphoreIdentityPCDTypeName;
  claim: SemaphoreIdentityPCDClaim;
  proof: SemaphoreIdentityPCDProof;
  id: string;

  public constructor(id: string, claim: SemaphoreIdentityPCDClaim) {
    this.claim = claim;
    this.proof = undefined;
    this.id = id;
  }
}

interface SemaphoreIdentityPCDClaim {
  identity: Identity;
}

type SemaphoreIdentityPCDProof = undefined;

const SemaphoreIdentityPCDTypeName = "semaphore-identity-pcd";
