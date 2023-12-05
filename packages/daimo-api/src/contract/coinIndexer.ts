import {
  OpStatus,
  TransferOpEvent,
  guessTimestampFromNum,
} from "@daimo/common";
import { daimoChainFromId, erc20ABI } from "@daimo/contract";
import { DaimoNonce } from "@daimo/userop";
import { Pool } from "pg";
import { Address, Hex, numberToHex } from "viem";

import { OpIndexer } from "./opIndexer";
import { chainConfig } from "../env";
import { ViemClient } from "../network/viemClient";

export interface Transfer {
  address: Hex;
  blockNumber: bigint;
  blockHash: Hex;
  transactionHash: Hex;
  transactionIndex: number;
  logIndex: number;
  from: Address;
  to: Address;
  value: bigint;
}

/* USDC or testUSDC stablecoin contract. Tracks transfers. */
export class CoinIndexer {
  private allTransfers: Transfer[] = [];

  private listeners: ((transfers: Transfer[]) => void)[] = [];

  constructor(private client: ViemClient, private opIndexer: OpIndexer) {}

  load = async (pg: Pool, from: bigint, to: bigint) => {
    const result = await pg.query(
      `
        select
          block_num,
          encode(block_hash, 'hex') as block_hash,
          encode(tx_hash, 'hex') as tx_hash,
          tx_idx,
          log_idx,
          encode(log_addr, 'hex') as log_addr,

          encode(f, 'hex') as "from",
          encode(t, 'hex') as "to",
          v as "value",
        from transfers
        where block_num >= $1
        and block_num <= $2
        and log_addr = '\\x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
      `,
      [from, to]
    );
    const logs: Transfer[] = result.rows.map((row) => {
      return {
        blockHash: row.block_hash,
        blockNumber: BigInt(row.block_num),
        transactionHash: row.tx_hash,
        transactionIndex: row.tx_idx,
        logIndex: row.log_idx,
        address: row.log_addr,
        from: `0x${row.from}`,
        to: `0x${row.to}`,
        value: BigInt(row.value),
      };
    });
    console.log(`[COIN] loaded ${logs.length} transfers ${from} ${to}`);
    this.allTransfers.push(...logs);
    this.listeners.forEach((l) => l(logs));
  };

  /** Get balance as of a block height. */
  async getBalanceAt(addr: Address, blockNum: number) {
    const blockNumber = BigInt(blockNum);
    return this.client.publicClient.readContract({
      abi: erc20ABI,
      address: chainConfig.tokenAddress,
      functionName: "balanceOf",
      args: [addr],
      blockNumber,
    });
  }

  /** Listener invoked for all past coin transfers, then for new ones. */
  pipeAllTransfers(listener: (logs: Transfer[]) => void) {
    listener(this.allTransfers);
    this.addListener(listener);
  }

  /** Listener is invoked for all new coin transfers. */
  addListener(listener: (logs: Transfer[]) => void) {
    this.listeners.push(listener);
  }

  /** Unsubscribe from new coin transfers. */
  removeListener(listener: (logs: Transfer[]) => void) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  /**
   * Returns all transfer events from or to a given address,
   * with fees included and excluding paymaster transfers.
   */
  filterTransfers({
    addr,
    sinceBlockNum,
    txHashes,
  }: {
    addr: Address;
    sinceBlockNum?: bigint;
    txHashes?: Hex[];
  }): TransferOpEvent[] {
    let relevantTransfers = this.allTransfers.filter(
      (log) => log.from === addr || log.to === addr
    );
    if (sinceBlockNum) {
      relevantTransfers = relevantTransfers.filter(
        (log) => (log.blockNumber || 0n) >= sinceBlockNum
      );
    }
    if (txHashes !== undefined) {
      relevantTransfers = relevantTransfers.filter((log) =>
        txHashes.includes(log.transactionHash || "0x")
      );
    }

    const transferOpsIncludingPaymaster = relevantTransfers.map((log) =>
      this.attachTransferOpProperties(log)
    );

    const transferOps = this.attachFeeAmounts(transferOpsIncludingPaymaster);

    return transferOps;
  }

  /* Populates atomic properties of logs to convert it Op Event.
   * Does not account for fees since they involve multiple logs.
   */
  private attachTransferOpProperties(log: Transfer): TransferOpEvent {
    const {
      blockNumber,
      blockHash,
      logIndex,
      transactionHash,
      from,
      to,
      value,
    } = log;
    const userOp = this.opIndexer.fetchUserOpLog(transactionHash, logIndex);
    const opHash = userOp?.hash;
    const nonceMetadata = userOp
      ? DaimoNonce.fromHex(
          numberToHex(userOp.nonce, { size: 32 })
        )?.metadata.toHex()
      : undefined;

    return {
      type: "transfer",
      status: OpStatus.confirmed,
      timestamp: guessTimestampFromNum(
        Number(blockNumber),
        daimoChainFromId(chainConfig.chainL2.id)
      ),
      from,
      to,
      amount: Number(value),
      blockNumber: Number(blockNumber),

      blockHash,
      txHash: transactionHash,
      logIndex,
      nonceMetadata,
      opHash,
    };
  }

  /* Attach fee amounts to transfer ops and filter out transfers involving
   * paymaster.
   * TODO: unit test this function
   */
  private attachFeeAmounts(
    transferOpsIncludingPaymaster: TransferOpEvent[]
  ): TransferOpEvent[] {
    // Map of opHash to fee amount paid to paymaster address
    const opHashToFee = new Map<Hex, number>();
    for (const op of transferOpsIncludingPaymaster) {
      if (op.opHash === undefined) continue;

      const prevFee = opHashToFee.get(op.opHash) || 0;

      if (op.to === chainConfig.pimlicoPaymasterAddress) {
        opHashToFee.set(op.opHash, prevFee + op.amount);
      } else if (op.from === chainConfig.pimlicoPaymasterAddress) {
        // Account for fee refund
        opHashToFee.set(op.opHash, prevFee - op.amount);
      }
    }

    const transferOps = transferOpsIncludingPaymaster
      .filter(
        // Remove paymaster logs
        (op) =>
          op.from !== chainConfig.pimlicoPaymasterAddress &&
          op.to !== chainConfig.pimlicoPaymasterAddress
      )
      .map((op) => {
        // Attach fee amounts to other transfers
        return {
          ...op,
          feeAmount: opHashToFee.get(op.opHash!) || 0,
        };
      });

    return transferOps;
  }
}
