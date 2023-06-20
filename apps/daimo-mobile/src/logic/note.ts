import * as Contracts from "@daimo/contract";
import { Address, PublicClient, getContract } from "viem";

export type EphemeralNote = {
  owner: Address;
  from: Address;
  amount: bigint;
};

export async function fetchNote(
  publicClient: PublicClient,
  ephemeralOwner: `0x${string}`
): Promise<EphemeralNote | undefined> {
  const notesContract = getContract({
    abi: Contracts.ephemeralNotesABI,
    address: Contracts.ephemeralNotesAddress,
    publicClient,
  });

  const res = await notesContract.read.notes([ephemeralOwner]);
  if (res[0] !== ephemeralOwner) {
    return undefined;
  } else {
    return {
      owner: res[0],
      from: res[1],
      amount: res[2],
    };
  }
}

export async function fetchNotesContractAllowance(
  publicClient: PublicClient,
  address: Address
): Promise<bigint> {
  const tokenContract = getContract({
    abi: Contracts.erc20ABI,
    address: Contracts.tokenMetadata.address,
    publicClient,
  });

  const allowance = await tokenContract.read.allowance([
    address,
    Contracts.ephemeralNotesAddress,
  ]);
  return allowance;
}

// Dummy signature of correct length and valid r/s values (so ECDSA.sol doesn't revert)
export const dummySignature: `0x${string}` = `0x001d2a4239a139c1e44088f0a2e8e0c9aa66755573b4c24da5828d77d80bafb0495101dbf6304da3cacd7eaf3a8a11ec8f291a6945a46715f35a9182c5ec55521c`;
