import { base58 } from "@scure/base";
import { Address, Hex, getAddress, hexToBytes, keccak256 } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

export function getNoteId(ephemeralOwner: Address) {
  return base58.encode(hexToBytes(ephemeralOwner)).slice(0, 5);
}

export async function getNoteClaimSignature(
  sender: Address,
  recipient: Address,
  notePrivateKey: Hex | undefined
) {
  if (recipient === sender) return dummySignature;
  if (!notePrivateKey) throw new Error("Cannot claim without secret");

  const ephemeralAccount = privateKeyToAccount(notePrivateKey);
  const message = keccak256(recipient);
  const signature = await ephemeralAccount.signMessage({
    message: { raw: message },
  });
  return signature;
}

export async function getNoteClaimSignatureFromSeed(
  sender: Address,
  recipient: Address,
  seed: string | undefined
) {
  if (recipient === sender) return dummySignature;
  if (!seed) throw new Error("Cannot claim without seed");

  const hexSeed = base58.decode(seed);
  const notePrivateKey = keccak256(hexSeed);

  return getNoteClaimSignature(sender, recipient, notePrivateKey);
}

export function generateNoteSeedAddress(): [string, Address] {
  const hexSeed = generatePrivateKey().slice(
    0,
    2 + Number(128 / 4) // One hex is 4 bits
  ) as Hex; // 128-bit cryptographic random seed.

  const seed = base58.encode(hexToBytes(hexSeed));

  const notePrivateKey = keccak256(hexSeed);
  const noteAddress = getAddress(
    privateKeyToAccount(notePrivateKey).address
  ) as Address;

  return [seed, noteAddress];
}

// TODO: remove once EphemeralNote V1 contract is banished.
// Dummy signature of correct length and valid r/s values (so ECDSA.sol doesn't revert)
const dummySignature: `0x${string}` = `0x001d2a4239a139c1e44088f0a2e8e0c9aa66755573b4c24da5828d77d80bafb0495101dbf6304da3cacd7eaf3a8a11ec8f291a6945a46715f35a9182c5ec55521c`;
