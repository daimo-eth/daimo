import * as Contracts from "@daimo/contract";
import { useEffect, useState } from "react";
import {
  Address,
  Hex,
  PublicClient,
  createPublicClient,
  createWalletClient,
  getContract,
  http,
  keccak256,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseGoerli } from "viem/chains";

import { chainConfig } from "./chainConfig";

export type EphemeralNote = {
  owner: Address;
  from: Address;
  amount: bigint;
};

type EphemeralNoteLoadState = "loading" | "error" | "loaded";

// TODO: remove eth JSON RPC dependency
// Notes can be loaded thru the API to miminize round trips
let clientL2: PublicClient | undefined;
function getClientL2() {
  if (!clientL2) {
    clientL2 = createPublicClient({ chain: chainConfig.l2, transport: http() });
  }
  return clientL2;
}

export function useFetchNote(
  ephemeralOwner: `0x${string}`
): [EphemeralNote | undefined, EphemeralNoteLoadState] {
  const [note, setNote] = useState<EphemeralNote | undefined>(undefined);
  const [loadState, setLoadState] = useState<EphemeralNoteLoadState>("loading");

  useEffect(() => {
    (async () => {
      const note = await fetchNote(ephemeralOwner);
      console.log(`[NOTE] fetched note ${ephemeralOwner}: ${note?.amount}`);
      setNote(note);
      if (note) setLoadState("loaded");
      else setLoadState("error");
    })();
  }, [ephemeralOwner]);

  return [note, loadState];
}

async function fetchNote(
  ephemeralOwner: `0x${string}`
): Promise<EphemeralNote | undefined> {
  const notesContract = getContract({
    abi: Contracts.ephemeralNotesABI,
    address: Contracts.ephemeralNotesAddress,
    publicClient: getClientL2(),
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
  address: Address
): Promise<bigint> {
  const tokenContract = getContract({
    abi: Contracts.erc20ABI,
    address: Contracts.tokenMetadata.address,
    publicClient: getClientL2(),
  });

  const allowance = await tokenContract.read.allowance([
    address,
    Contracts.ephemeralNotesAddress,
  ]);
  return allowance;
}

export function useEphemeralSignature(
  ephemeralPrivateKey: `0x${string}` | undefined,
  recipient: Address
) {
  const [ephemeralSignature, setEphemeralSignature] = useState<Hex>("0x");

  useEffect(() => {
    (async () => {
      if (!ephemeralPrivateKey) {
        // Must be sender themselves reclaiming
        setEphemeralSignature(dummySignature);
        return;
      }
      const ephemeralAccount = privateKeyToAccount(ephemeralPrivateKey);
      const ephemeralClient = createWalletClient({
        account: ephemeralAccount,
        chain: baseGoerli,
        transport: http(),
        // TODO: webSocket("wss://base-goerli.public.blastapi.io")
      });
      const message = keccak256(recipient);
      const signature = await ephemeralClient.signMessage({
        message: { raw: message },
      });
      setEphemeralSignature(signature);
    })();
  }, [ephemeralPrivateKey]);

  return ephemeralSignature;
}

// Dummy signature of correct length and valid r/s values (so ECDSA.sol doesn't revert)
const dummySignature: `0x${string}` = `0x001d2a4239a139c1e44088f0a2e8e0c9aa66755573b4c24da5828d77d80bafb0495101dbf6304da3cacd7eaf3a8a11ec8f291a6945a46715f35a9182c5ec55521c`;
