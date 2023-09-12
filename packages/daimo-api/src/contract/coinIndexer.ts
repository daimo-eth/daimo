import {
  OpStatus,
  TransferOpEvent,
  guessTimestampFromNum,
} from "@daimo/common";
import { erc20ABI, tokenMetadata } from "@daimo/contract";
import { Address, Hex, Log, getAbiItem } from "viem";

import { OpIndexer } from "./opIndexer";
import { ViemClient } from "../chain";

const transferEvent = getAbiItem({ abi: erc20ABI, name: "Transfer" });
export type TransferLog = Log<
  bigint,
  number,
  false,
  typeof transferEvent,
  true
>;

/* USDC or testUSDC stablecoin contract. Tracks transfers. */
export class CoinIndexer {
  private allTransfers: TransferOpEvent[] = [];

  private listeners: ((logs: TransferOpEvent[]) => void)[] = [];

  constructor(private client: ViemClient, private opIndexer: OpIndexer) {}

  async init() {
    await this.client.pipeLogs(
      {
        address: tokenMetadata.address,
        event: transferEvent,
      },
      this.parseLogs
    );
  }

  private parseLogs = (logs: TransferLog[]) => {
    if (logs.length === 0) return;

    const ops = logs.map((log) => this.logToTransferOp(log));
    this.allTransfers.push(...ops);
    this.listeners.forEach((l) => l(ops));
  };

  /** Get balance as of a block height. */
  async getBalanceAt(addr: Address, blockNum: number) {
    const blockNumber = BigInt(blockNum);
    return this.client.publicClient.readContract({
      abi: erc20ABI,
      address: tokenMetadata.address,
      functionName: "balanceOf",
      args: [addr],
      blockNumber,
    });
  }

  /** Listener invoked for all past coin transfers, then for new ones. */
  pipeAllTransfers(listener: (logs: TransferOpEvent[]) => void) {
    listener(this.allTransfers);
    this.addListener(listener);
  }

  /** Listener is invoked for all new coin transfers. */
  addListener(listener: (logs: TransferOpEvent[]) => void) {
    this.listeners.push(listener);
  }

  /** Unsubscribe from new coin transfers. */
  removeListener(listener: (logs: TransferOpEvent[]) => void) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  /** Returns all transfers from or to a given address */
  filterTransfers({
    addr,
    sinceBlockNum,
    txHashes,
  }: {
    addr: Address;
    sinceBlockNum?: bigint;
    txHashes?: Hex[];
  }): TransferOpEvent[] {
    let ret = this.allTransfers.filter(
      (log) => log.from === addr || log.to === addr
    );
    if (sinceBlockNum) {
      ret = ret.filter((log) => (log.blockNumber || 0n) >= sinceBlockNum);
    }
    if (txHashes !== undefined) {
      ret = ret.filter((log) => txHashes.includes(log.txHash || "0x"));
    }
    // HACK: Ignore paymaster transfers for now
    // TODO: Stop doing that and show them in UI
    ret = ret.filter(
      (log) =>
        log.from !== tokenMetadata.paymasterAddress &&
        log.to !== tokenMetadata.paymasterAddress
    );

    return ret;
  }

  private logToTransferOp(log: TransferLog): TransferOpEvent {
    const { blockNumber, blockHash, logIndex, transactionHash } = log;
    const { from, to, value } = log.args;
    const nonceMetadata = this.opIndexer.fetchNonceMetadata(
      transactionHash,
      logIndex
    );

    if (
      blockNumber == null ||
      blockHash == null ||
      logIndex == null ||
      transactionHash == null
    ) {
      throw new Error(`pending log ${JSON.stringify(log)}`);
    }

    return {
      type: "transfer",
      status: OpStatus.confirmed,
      timestamp: guessTimestampFromNum(Number(blockNumber), "base-goerli"),
      from,
      to,
      amount: Number(value),
      blockNumber: Number(blockNumber),

      blockHash,
      txHash: transactionHash,
      logIndex,
      nonceMetadata,
    };
  }
}
