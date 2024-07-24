import type { ColumnType } from "kysely";
import type { IPostgresInterval } from "postgres-interval";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Int8 = ColumnType<string, bigint | number | string, bigint | number | string>;

export type Interval = ColumnType<IPostgresInterval, IPostgresInterval | number, IPostgresInterval | number>;

export type Json = JsonValue;

export type JsonArray = JsonValue[];

export type JsonObject = {
  [K in string]?: JsonValue;
};

export type JsonPrimitive = boolean | number | string | null;

export type JsonValue = JsonArray | JsonObject | JsonPrimitive;

export type Numeric = ColumnType<string, number | string, number | string>;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface Blocks {
  block_hash: Buffer;
  block_num: Int8;
  block_ts: Int8;
  chain_id: number;
}

export interface DaimoTransfers {
  amount: Numeric;
  block_hash: Buffer;
  block_num: Int8;
  block_ts: Int8;
  chain_id: number;
  f: Buffer;
  sort_idx: number;
  t: Buffer;
  token: Buffer | null;
  tx_hash: Buffer;
  tx_idx: number;
}

export interface Erc20Transfers {
  abi_idx: number | null;
  block_hash: Buffer | null;
  block_num: Numeric | null;
  chain_id: Numeric | null;
  f: Buffer | null;
  ig_name: string | null;
  log_addr: Buffer | null;
  log_idx: number | null;
  src_name: string | null;
  t: Buffer | null;
  tx_hash: Buffer | null;
  tx_idx: Numeric | null;
  v: Numeric | null;
}

export interface Erc4337UserOp {
  abi_idx: number | null;
  block_hash: Buffer | null;
  block_num: Numeric | null;
  chain_id: Numeric | null;
  ig_name: string | null;
  log_addr: Buffer | null;
  log_idx: number | null;
  op_actual_gas_cost: Numeric | null;
  op_actual_gas_used: Numeric | null;
  op_hash: Buffer | null;
  op_nonce: Numeric | null;
  op_paymaster: Buffer | null;
  op_sender: Buffer | null;
  op_success: boolean | null;
  src_name: string | null;
  tx_hash: Buffer | null;
  tx_idx: Numeric | null;
}

export interface EthTransfers {
  block_hash: Buffer | null;
  block_num: Numeric | null;
  call_type: string | null;
  chain_id: Numeric | null;
  from: Buffer | null;
  ig_name: string | null;
  src_name: string | null;
  to: Buffer | null;
  trace_action_idx: number | null;
  tx_hash: Buffer | null;
  tx_idx: Numeric | null;
  value: Numeric | null;
}

export interface IgUpdates {
  backfill: Generated<boolean | null>;
  latency: Interval | null;
  name: string;
  nrows: Numeric | null;
  num: Numeric;
  src_name: string;
  stop: Numeric | null;
}

export interface Integrations {
  conf: Json | null;
  name: string | null;
}

export interface KeyAdded {
  abi_idx: number | null;
  account: Buffer | null;
  block_hash: Buffer | null;
  block_num: Numeric | null;
  chain_id: Numeric | null;
  ig_name: string | null;
  key: Buffer | null;
  key_slot: number | null;
  log_addr: Buffer | null;
  log_idx: number | null;
  src_name: string | null;
  tx_hash: Buffer | null;
  tx_idx: Numeric | null;
}

export interface KeyRemoved {
  abi_idx: number | null;
  account: Buffer | null;
  block_hash: Buffer | null;
  block_num: Numeric | null;
  chain_id: Numeric | null;
  ig_name: string | null;
  key: Buffer | null;
  key_slot: number | null;
  log_addr: Buffer | null;
  log_idx: number | null;
  src_name: string | null;
  tx_hash: Buffer | null;
  tx_idx: Numeric | null;
}

export interface Latest {
  num: Numeric | null;
  src_name: string | null;
}

export interface Names {
  addr: Buffer | null;
  block_hash: Buffer | null;
  block_num: Numeric | null;
  chain_id: Numeric | null;
  ig_name: string | null;
  log_addr: Buffer | null;
  log_idx: number | null;
  name: Buffer | null;
  src_name: string | null;
  tx_hash: Buffer | null;
  tx_idx: Numeric | null;
}

export interface NoteCreated {
  abi_idx: number | null;
  amount: Numeric | null;
  block_hash: Buffer | null;
  block_num: Numeric | null;
  chain_id: Numeric | null;
  ephemeral_owner: Buffer | null;
  f: Buffer | null;
  ig_name: string | null;
  log_addr: Buffer | null;
  log_idx: number | null;
  src_name: string | null;
  tx_hash: Buffer | null;
  tx_idx: Numeric | null;
}

export interface NoteRedeemed {
  abi_idx: number | null;
  amount: Numeric | null;
  block_hash: Buffer | null;
  block_num: Numeric | null;
  chain_id: Numeric | null;
  ephemeral_owner: Buffer | null;
  f: Buffer | null;
  ig_name: string | null;
  log_addr: Buffer | null;
  log_idx: number | null;
  redeemer: Buffer | null;
  src_name: string | null;
  tx_hash: Buffer | null;
  tx_idx: Numeric | null;
}

export interface RequestCancelled {
  abi_idx: number | null;
  block_hash: Buffer | null;
  block_num: Numeric | null;
  canceller: Buffer | null;
  chain_id: Numeric | null;
  id: Numeric | null;
  ig_name: string | null;
  log_addr: Buffer | null;
  log_idx: number | null;
  src_name: string | null;
  tx_hash: Buffer | null;
  tx_idx: Numeric | null;
}

export interface RequestCreated {
  abi_idx: number | null;
  amount: Numeric | null;
  block_hash: Buffer | null;
  block_num: Numeric | null;
  chain_id: Numeric | null;
  creator: Buffer | null;
  id: Numeric | null;
  ig_name: string | null;
  log_addr: Buffer | null;
  log_idx: number | null;
  metadata: Buffer | null;
  recipient: Buffer | null;
  src_name: string | null;
  tx_hash: Buffer | null;
  tx_idx: Numeric | null;
}

export interface RequestFulfilled {
  abi_idx: number | null;
  block_hash: Buffer | null;
  block_num: Numeric | null;
  chain_id: Numeric | null;
  fulfiller: Buffer | null;
  id: Numeric | null;
  ig_name: string | null;
  log_addr: Buffer | null;
  log_idx: number | null;
  src_name: string | null;
  tx_hash: Buffer | null;
  tx_idx: Numeric | null;
}

export interface Sources {
  chain_id: number | null;
  name: string | null;
  url: string | null;
}

export interface SourceUpdates {
  hash: Buffer | null;
  latency: Interval | null;
  nblocks: Numeric | null;
  nrows: Numeric | null;
  num: Numeric | null;
  src_hash: Buffer | null;
  src_name: string | null;
  src_num: Numeric | null;
}

export interface TaskUpdates {
  chain_id: number | null;
  hash: Buffer | null;
  ig_name: string | null;
  insert_at: Generated<Timestamp | null>;
  latency: Interval | null;
  nblocks: Numeric | null;
  nrows: Numeric | null;
  num: Numeric | null;
  src_hash: Buffer | null;
  src_name: string | null;
  src_num: Numeric | null;
  stop: Numeric | null;
}

export interface TmpDel {
  max_blk: Int8;
}

export interface Transfers {
  abi_idx: number | null;
  block_hash: Buffer | null;
  block_num: Numeric | null;
  chain_id: Numeric | null;
  f: Buffer | null;
  ig_name: string | null;
  log_addr: Buffer | null;
  log_idx: number | null;
  src_name: string | null;
  t: Buffer | null;
  tx_hash: Buffer | null;
  tx_idx: Numeric | null;
  v: Numeric | null;
}

export interface DB {
  blocks: Blocks;
  daimo_transfers: DaimoTransfers;
  erc20_transfers: Erc20Transfers;
  erc4337_user_op: Erc4337UserOp;
  eth_transfers: EthTransfers;
  ig_updates: IgUpdates;
  integrations: Integrations;
  key_added: KeyAdded;
  key_removed: KeyRemoved;
  latest: Latest;
  names: Names;
  note_created: NoteCreated;
  note_redeemed: NoteRedeemed;
  request_cancelled: RequestCancelled;
  request_created: RequestCreated;
  request_fulfilled: RequestFulfilled;
  source_updates: SourceUpdates;
  sources: Sources;
  task_updates: TaskUpdates;
  tmp_del: TmpDel;
  transfers: Transfers;
}
