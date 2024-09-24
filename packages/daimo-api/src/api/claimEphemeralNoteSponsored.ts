import { DaimoNoteState } from "@daimo/common";
import { daimoEphemeralNotesV2Abi } from "@daimo/contract";
import { Address, Hex, keccak256, verifyMessage } from "viem";

import { NoteIndexer } from "../contract/noteIndexer";
import { chainConfig } from "../env";
import { ViemClient } from "../network/viemClient";

export async function claimEphemeralNoteSponsored(
  vc: ViemClient,
  noteIndexer: NoteIndexer,
  ephemeralOwner: Address,
  recipient: Address,
  signature: Hex
): Promise<Hex> {
  // Verify note is available to claim and signature is valid
  const noteStatus = noteIndexer.getNoteStatusByOwner(ephemeralOwner);
  if (!noteStatus || noteStatus.status !== DaimoNoteState.Confirmed) {
    throw new Error("cannot claim note");
  }

  const valid = await verifyMessage({
    address: ephemeralOwner,
    message: { raw: keccak256(recipient) },
    signature,
  });
  if (!valid) {
    throw new Error("invalid signature");
  }

  const claimTxHash = await vc.writeContract({
    abi: daimoEphemeralNotesV2Abi,
    address: chainConfig.notesV2Address,
    functionName: "claimNoteRecipient",
    args: [ephemeralOwner, recipient, signature],
  });

  return claimTxHash;
}
