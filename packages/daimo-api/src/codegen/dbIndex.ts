import type { ColumnType } from "kysely";

export type Int8 = ColumnType<
  string,
  bigint | number | string,
  bigint | number | string
>;

export type Numeric = ColumnType<string, number | string, number | string>;

export interface IndexDaimoAcct {
  addr: Buffer;
  block_hash: Buffer;
  block_num: Numeric;
  block_ts: Numeric;
  bridger: Buffer;
  chain_id: Numeric;
  home_chain_id: Numeric;
  home_coin: Buffer;
  key: Buffer;
  key_slot: number;
  log_addr: Buffer;
  log_idx: Numeric;
  log_name: string;
  salt: Buffer;
  swapper: Buffer;
  tx_hash: Buffer;
  tx_idx: Numeric;
}

export interface IndexDaimoAcctUpdate {
  block_hash: Buffer;
  block_num: Numeric;
  block_ts: Numeric;
  chain_id: Numeric;
  forwarding_address: Buffer | null;
  key: Buffer | null;
  key_slot: number | null;
  log_addr: Buffer;
  log_idx: Numeric;
  log_name: string;
  new_home_coin: Buffer | null;
  old_home_coin: Buffer | null;
  tx_hash: Buffer;
  tx_idx: Numeric;
}

export interface IndexDaimoBlock {
  chain_id: Int8;
  hash: Buffer;
  inserted_at: Int8 | null;
  number: Int8;
  parent_hash: Buffer;
  timestamp: Int8;
}

export interface IndexDaimoFastCctp {
  block_hash: Buffer;
  block_num: Numeric;
  block_ts: Numeric;
  chain_id: Numeric;
  final_recipient: Buffer | null;
  from_addr: Buffer;
  from_amount: Numeric;
  from_chain_id: Numeric;
  from_token: Buffer | null;
  handoff_addr: Buffer;
  log_addr: Buffer;
  log_idx: Numeric;
  log_name: string;
  new_recipient: Buffer | null;
  nonce: Numeric;
  to_addr: Buffer;
  to_amount: Numeric;
  to_chain_id: Numeric;
  to_token: Buffer;
  tx_hash: Buffer;
  tx_idx: Numeric;
}

export interface IndexDaimoIndex {
  chain_id: Numeric;
  latest_block_num: Numeric;
}

export interface IndexDaimoName {
  addr: Buffer;
  block_hash: Buffer;
  block_num: Numeric;
  block_ts: Numeric;
  chain_id: Numeric;
  log_addr: Buffer;
  log_idx: Numeric;
  log_name: string;
  name: Buffer;
  tx_hash: Buffer;
  tx_idx: Numeric;
}

export interface IndexDaimoNote {
  amount: Numeric;
  block_hash: Buffer;
  block_num: Numeric;
  block_ts: Numeric;
  chain_id: Numeric;
  creator: Buffer;
  ephemeral_owner: Buffer;
  log_addr: Buffer;
  log_idx: Numeric;
  log_name: string;
  redeemer: Buffer | null;
  tx_hash: Buffer;
  tx_idx: Numeric;
}

export interface IndexDaimoOp {
  block_hash: Buffer;
  block_num: Numeric;
  block_ts: Numeric;
  chain_id: Numeric;
  log_addr: Buffer;
  log_idx: Numeric;
  log_name: string;
  op_actual_gas_cost: Numeric;
  op_actual_gas_used: Numeric;
  op_hash: Buffer;
  op_nonce: Numeric;
  op_paymaster: Buffer;
  op_sender: Buffer;
  op_success: boolean;
  tx_hash: Buffer;
  tx_idx: Numeric;
}

export interface IndexDaimoRequest {
  amount: Numeric | null;
  block_hash: Buffer;
  block_num: Numeric;
  block_ts: Numeric;
  canceller: Buffer | null;
  chain_id: Numeric;
  creator: Buffer | null;
  fulfiller: Buffer | null;
  id: Numeric;
  log_addr: Buffer;
  log_idx: Numeric;
  log_name: string;
  metadata: Buffer | null;
  recipient: Buffer | null;
  tx_hash: Buffer;
  tx_idx: Numeric;
}

export interface IndexDaimoTransfer {
  amount: Numeric;
  block_hash: Buffer;
  block_num: Numeric;
  block_ts: Numeric;
  chain_id: Numeric;
  f: Buffer;
  sort_idx: Numeric;
  t: Buffer;
  token: Buffer;
  tx_hash: Buffer;
  tx_idx: Numeric;
}

export interface IndexDaimoTransferTx {
  block_hash: Buffer;
  block_num: Numeric;
  block_ts: Numeric;
  chain_id: Numeric;
  tx_hash: Buffer;
  tx_idx: Numeric;
}

export interface DB {
  "index.daimo_acct": IndexDaimoAcct;
  "index.daimo_acct_update": IndexDaimoAcctUpdate;
  "index.daimo_block": IndexDaimoBlock;
  "index.daimo_fast_cctp": IndexDaimoFastCctp;
  "index.daimo_index": IndexDaimoIndex;
  "index.daimo_name": IndexDaimoName;
  "index.daimo_note": IndexDaimoNote;
  "index.daimo_op": IndexDaimoOp;
  "index.daimo_request": IndexDaimoRequest;
  "index.daimo_transfer": IndexDaimoTransfer;
  "index.daimo_transfer_tx": IndexDaimoTransferTx;
}
