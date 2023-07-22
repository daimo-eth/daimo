import type { AbiEvent } from "abitype";
import {
  Abi,
  Account,
  Address,
  BlockTag,
  GetContractReturnType,
  GetLogsReturnType,
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
export function getViemClientFromEnv() {
  const chain = baseGoerli; // TODO: DAIMO_API_CHAIN once mainnet is supported
  const account = getAccount(process.env.DAIMO_API_PRIVATE_KEY);
  const transport = http(process.env.DAIMO_API_L2_RPC_URL);
  const publicClient = createPublicClient({ chain, transport });
  const walletClient = createWalletClient({ chain, transport, account });

  return new ViemClient(publicClient, walletClient);
}

export function getAccount(privateKey?: string) {
  if (!privateKey) throw new Error("Missing private key");
  return privateKeyToAccount(`0x${privateKey}`);
}

export class ViemClient {
  constructor(
    public publicClient: PublicClient<Transport, Chain>,
    public walletClient: WalletClient<Transport, Chain, Account>
  ) {}

  async pipeLogs<E extends AbiEvent | undefined>(
    args: { address: Address; event: E },
    callback: (logs: GetLogsReturnType<E, true>) => void
  ) {
    const latest = await this.publicClient.getBlock({ blockTag: "latest" });
    if (latest.number == null) throw new Error("Missing block number");

    const pipeName = args.event?.name || args.address.substring(0, 8);

    // TODO: save in DB, dont load from scratch every time
    // TODO: hack for faster startup
    let fromBlock = 0n;
    if (this.publicClient.chain.id === baseGoerli.id) {
      fromBlock = args.event == null ? 7000000n : 5000000n;
    }
    const step = 10000n;
    for (; fromBlock < latest.number; fromBlock += step) {
      let toBlock = (fromBlock + step) as BlockTag | bigint;
      if ((toBlock as bigint) > latest.number) toBlock = "latest";
      console.log(`[CHAIN] loading ${fromBlock} to ${toBlock} for ${pipeName}`);
      const logs = await retryBackoff(`logs-${pipeName}`, () =>
        this.publicClient.getLogs({
          ...args,
          fromBlock,
          toBlock,
          strict: true,
        })
      );
      if (logs.length > 0) callback(logs);
    }

    this.publicClient.watchEvent({
      ...args,
      strict: true,
      onLogs: (logs) => {
        console.log(`[CHAIN] pipe ${pipeName}, ${logs.length} logs`);
        callback(logs);
      },
    });
  }
}

export async function retryBackoff<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  for (let i = 1; i <= 10; i++) {
    try {
      return await fn();
    } catch (e) {
      console.log(`[CHAIN] ${name} retry ${i} after error: ${e}`);
      await new Promise((r) => setTimeout(r, 250 * 2 ** i));
    }
  }
  // TODO: add performance logging
  throw new Error(`too many retries: ${name}`);
}

export type ContractType<TAbi extends Abi> = GetContractReturnType<
  TAbi,
  PublicClient<Transport, Chain>,
  WalletClient<Transport, Chain, Account>
>;

export type ReadOnlyContractType<TAbi extends Abi> = GetContractReturnType<
  TAbi,
  PublicClient<Transport, Chain>
>;
