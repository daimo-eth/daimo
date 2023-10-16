import { chainConfig } from "@daimo/contract";
import { Address, Hex, createWalletClient, http, keccak256 } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export async function getNoteClaimSignature(
  sender: Address,
  recipient: Address,
  notePrivateKey: Hex | undefined
) {
  if (recipient === sender) return dummySignature;
  if (!notePrivateKey) throw new Error("Cannot claim without secret");

  const ephemeralAccount = privateKeyToAccount(notePrivateKey);
  const ephemeralClient = createWalletClient({
    account: ephemeralAccount,
    chain: chainConfig.chainL2,
    transport: http(), // unused
  });
  const message = keccak256(recipient);
  const signature = await ephemeralClient.signMessage({
    message: { raw: message },
  });
  return signature;
}

// TODO: remove once EphemeralNote contract no longer requires it.
// Dummy signature of correct length and valid r/s values (so ECDSA.sol doesn't revert)
const dummySignature: `0x${string}` = `0x001d2a4239a139c1e44088f0a2e8e0c9aa66755573b4c24da5828d77d80bafb0495101dbf6304da3cacd7eaf3a8a11ec8f291a6945a46715f35a9182c5ec55521c`;
