import { getTokenList } from "@asset-projects/token-list";
import { erc20_transfers, erc4337_userops } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { Address, Hex, getAddress, hexToBytes, toHex } from "viem";

import { EAddrSummary, EOpSummary, EUserOp } from "./ethereumModel";
import { prisma } from "./prisma";
import { maybe } from "./util";
import { prettifyHex } from "./utils";

type UserOpRow = erc4337_userops;

const tokenList = getTokenList(5)!;

export async function loadOpSummary(hash: Hex): Promise<EOpSummary | null> {
  const op = await loadUserOpRow(hash);
  if (op == null) return null;

  const transferRows = await loadTransferRowsForOp(op);

  return {
    op: getUserOpFromRow(op),
    blockTimestamp: 0, // TODO: add blocks table
    transfers: transferRows.map(getTransferFromRow),
  };
}

function getTransferFromRow(t: erc20_transfers) {
  const tokenAddr = getAddress(toHex(t.contract!));

  const token = tokenList.ERC20.find((tok) => tok.address === tokenAddr);

  return {
    from: getAddress(toHex(t.f!)),
    to: getAddress(toHex(t.t!)),
    amount: BigInt(t.value!.toString()),
    token: token ? token.name : prettifyHex(tokenAddr),
  };
}

async function loadTransferRowsForOp(op: {
  transaction_hash: Buffer;
  log_index: Decimal;
}) {
  const nextLogIndex = await prisma.erc4337_userops.findFirst({
    select: {
      log_index: true,
    },
    where: {
      transaction_hash: op.transaction_hash,
      log_index: {
        gt: op.log_index,
      },
    },
    orderBy: {
      log_index: "asc",
    },
  });

  const transfers = await prisma.erc20_transfers.findMany({
    where: {
      transaction_hash: op.transaction_hash!,
      log_index: {
        gt: op.log_index!,
        lt: nextLogIndex ? nextLogIndex.log_index : undefined,
      },
    },
  });
  return transfers;
}

export async function loadUserOp(hash: Hex): Promise<EUserOp | null> {
  const o = await loadUserOpRow(hash);
  if (o == null) return null;
  return getUserOpFromRow(o);
}

function getUserOpFromRow(o: UserOpRow) {
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

async function loadUserOpRow(hash: Hex) {
  const ops = await prisma.erc4337_userops.findMany({
    where: {
      op_hash: Buffer.from(hexToBytes(hash)),
    },
    take: 1,
  });

  if (ops.length > 1) throw new Error(`Duplicate op in DB: ${hash}`);
  if (ops.length === 0) return null;
  const o = ops[0];

  return o;
}

export async function loadAddrSummary(
  addr: Address
): Promise<EAddrSummary | null> {
  // TODO: load recent ops
  // TODO: collate asset transfers, etc.
  return { address: addr };
}
