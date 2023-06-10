import {
  Abi,
  Account,
  GetContractReturnType,
  PublicClient,
  Transport,
  WalletClient,
  createPublicClient,
  createWalletClient,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { Chain, baseGoerli } from "viem/chains";

/**
 * Loads a wallet from the local DAIMO_API_PRIVATE_KEY env var.
 * This account sponsors gas for account creation (and a faucet, on testnet).
 */
export function getEnvWalletClient() {
  const chain = baseGoerli; // TODO: DAIMO_API_CHAIN once mainnet is supported
  const account = getAccount(process.env.DAIMO_API_PRIVATE_KEY);
  const transport = http();
  return createWalletClient({ chain, transport, account });
}

export function getAccount(privateKey?: string) {
  if (!privateKey) throw new Error("Missing private key");
  return privateKeyToAccount(`0x${privateKey}`);
}

export function getClients(
  walletClient: WalletClient<Transport, Chain, Account>
): ClientsType {
  const { chain } = walletClient;
  const transport = http();
  const publicClient = createPublicClient({ chain, transport });
  return { walletClient, publicClient };
}

export type ClientsType = {
  publicClient: PublicClient<Transport, Chain>;
  walletClient: WalletClient<Transport, Chain, Account>;
};

export type ContractType<TAbi extends Abi> = GetContractReturnType<
  TAbi,
  PublicClient<Transport, Chain>,
  WalletClient<Transport, Chain, Account>
>;
