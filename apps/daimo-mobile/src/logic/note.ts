import { useEffect, useState } from "react";
import { Address, Hex, createWalletClient, http, keccak256 } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseGoerli } from "viem/chains";

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

// TODO: remove once EphemeralNote contract no longer requires it.
// Dummy signature of correct length and valid r/s values (so ECDSA.sol doesn't revert)
const dummySignature: `0x${string}` = `0x001d2a4239a139c1e44088f0a2e8e0c9aa66755573b4c24da5828d77d80bafb0495101dbf6304da3cacd7eaf3a8a11ec8f291a6945a46715f35a9182c5ec55521c`;
