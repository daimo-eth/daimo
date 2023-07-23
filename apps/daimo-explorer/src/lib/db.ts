import { Address, Hex, hexToBytes, toHex } from "viem";

import { EAddrSummary, EUserOp } from "./ethereumModel";
import { prisma } from "./prisma";
import { maybe } from "./util";

export async function loadUserOp(hash: Hex): Promise<EUserOp | null> {
  const ops = await prisma.erc4337_userops.findMany({
    where: {
      op_hash: Buffer.from(hexToBytes(hash)),
    },
    take: 1,
  });

  if (ops.length > 1) throw new Error(`Duplicate op in DB: ${hash}`);
  if (ops.length === 0) return null;
  const o = ops[0];

  return {
    blockHash: maybe(toHex, o.block_hash),
    blockNumber: maybe(Number, o.block_number),
    chainID: maybe(Number, o.chain_id),
    contract: maybe(toHex, o.contract),
    eth: maybe(String, o.eth),
    logIndex: maybe(Number, o.log_index),
    opActualGasCost: maybe(String, o.op_actual_gas_cost),
    opActualGasUsed: maybe(String, o.op_actual_gas_used),
    opHash: maybe(toHex, o.op_hash),
    opNonce: maybe(String, o.op_nonce),
    opPaymaster: maybe(toHex, o.op_paymaster),
    opSender: maybe(toHex, o.op_sender),
    opSuccess: o.op_success,
    txHash: toHex(o.transaction_hash),
    txSender: maybe(toHex, o.tx_sender),
  };
}

export async function loadAddrSummary(
  addr: Address
): Promise<EAddrSummary | null> {
  // TODO: load recent ops
  // TODO: collate asset transfers, etc.
  return { address: addr };
}
