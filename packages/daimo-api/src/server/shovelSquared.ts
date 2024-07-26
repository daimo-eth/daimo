import { guessTimestampFromNum, retryBackoff } from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import { Kysely } from "kysely";
import { Pool } from "pg";

import { DB as ShovelDB } from "../codegen/dbShovel";
import { Indexer } from "../contract/indexer";
import { chainConfig } from "../env";

// Shovels from shovel to daimo_transfers. Keeps only transfers that are to or
// from a Daimo account. This can be replaced by a more direct route in the
// future without affecting anything else: downstream reads daimo_transfers.
export class ShovelSquared extends Indexer {
  constructor() {
    super(`SHOVEL^2`);
  }

  async load(pg: Pool, kdb: Kysely<ShovelDB>, from: number, to: number) {
    // Skip if we're already done
    const res = await kdb
      .selectFrom("daimo_transfers")
      .select(({ fn }) => [fn.max("block_num").as("max_block_num")])
      .where("chain_id", "=", chainConfig.chainL2.id)
      .executeTakeFirst();
    const maxBlockNum = res == null ? 0 : Number(res.max_block_num);
    if (maxBlockNum >= to) {
      console.log(`[SHOVEL] s^2 already done: ${from}-${to}`);
      return;
    }

    // The source shovel tables ShovelSquared shovels from are very large. Limit
    // batch size to avoid query timeoutes.
    const batchSize = 100;
    for (let i = Math.max(maxBlockNum + 1, from); i <= to; i += batchSize) {
      await this._loadInner(pg, i, Math.min(i + batchSize - 1, to));
    }
  }

  private async _loadInner(pg: Pool, from: number, to: number) {
    const { event, trace } = this.shovelSource;
    const startMs = performance.now();

    // First, port over shovel blocks
    const chainID = chainConfig.chainL2.id;
    const daimoChain = daimoChainFromId(chainID);
    const blockTsOffset = guessTimestampFromNum(0, daimoChain);
    await Promise.all([
      retryBackoff(`shovel^2-blocks-eth-${from}-${to}`, async () =>
        pg.query(
          `INSERT INTO blocks (chain_id, block_num, block_hash, block_ts)
          SELECT DISTINCT
            chain_id,
            block_num,
            block_hash,
            block_num * 2 + $3 as block_ts
          FROM eth_transfers
          WHERE ig_name='eth_transfers'
          AND src_name='${trace}'
          AND block_num BETWEEN $1 AND $2
          AND chain_id=$4
          ON CONFLICT DO NOTHING`,
          [from, to, blockTsOffset, chainID]
        )
      ),
      retryBackoff(`shovel^2-blocks-erc20-${from}-${to}`, async () =>
        pg.query(
          `INSERT INTO blocks (chain_id, block_num, block_hash, block_ts)
          SELECT DISTINCT
            chain_id,
            block_num,
            block_hash,
            block_num * 2 + $3 as block_ts
          FROM erc20_transfers
          WHERE ig_name='erc20_transfers'
          AND src_name='${event}'
          AND block_num BETWEEN $1 AND $2
          AND chain_id=$4
          ON CONFLICT DO NOTHING`,
          [from, to, blockTsOffset, chainID]
        )
      ),
    ]);
    let elapsedMs = (performance.now() - startMs) | 0;
    console.log(`[SHOVEL] s^2 add blocks: ${from}-${to} in ${elapsedMs}ms`);

    // Delete extraneous rows from [erc20,eth]_transfers
    // This breaks SwapClogMatcher, which relies on the existence of transfers
    // between (Uniswap pool, non-Daimo adddress).
    //
    // Disabling, replacing [erc20,eth]_transfers with daimo_transfers soon.
    //
    // await Promise.all([
    //   retryBackoff(`shovel^2-del-eth-${from}-${to}`, async () =>
    //     pg.query(
    //       `DELETE FROM eth_transfers
    //       WHERE ig_name='eth_transfers'
    //       AND src_name='${trace}'
    //       AND block_num BETWEEN $1 AND $2
    //       AND "from" NOT IN (SELECT addr FROM names)
    //       AND "to" NOT IN (SELECT addr FROM names)`,
    //       [from, to]
    //     )
    //   ),
    //   retryBackoff(`shovel^2-del-erc20-${from}-${to}`, async () =>
    //     pg.query(
    //       `DELETE FROM erc20_transfers
    //       WHERE ig_name='erc20_transfers'
    //       AND src_name='${event}'
    //       AND block_num BETWEEN $1 AND $2
    //       AND "f" NOT IN (SELECT addr FROM names)
    //       AND "t" NOT IN (SELECT addr FROM names)`,
    //       [from, to]
    //     )
    //   ),
    // ]);
    // elapsedMs = (performance.now() - startMs) | 0;
    // console.log(`[SHOVEL] s^2 del transfers: ${from}-${to} in ${elapsedMs}ms`);

    // Insert remaining rows into daimo_transfers
    await pg.query(
      `INSERT INTO daimo_transfers (
          chain_id,
          block_num,
          block_hash,
          block_ts,
          tx_idx,
          tx_hash,
          sort_idx,
          token,
          f,
          t,
          amount
        )
        SELECT
          chain_id,
          block_num,
          block_hash,
          block_num * 2 + $3 as block_ts,
          tx_idx,
          tx_hash,
          trace_action_idx::int * 2 + 1 as sort_idx,
          NULL as token,
          "from" as f,
          "to" as t,
          CAST("value" AS NUMERIC) as amount
        FROM eth_transfers
        WHERE ig_name='eth_transfers'
        	AND src_name='${trace}'
        	AND block_num BETWEEN $1 AND $2
          AND chain_id=$4
        UNION ALL
        SELECT
          chain_id,
          block_num,
          block_hash,
          block_num * 2 + $3 as block_ts,
          tx_idx,
          tx_hash,
          log_idx * 2 as sort_idx,
          log_addr as token,
          f,
          t,
          CAST(v AS NUMERIC) as amount
        FROM erc20_transfers
        WHERE ig_name='erc20_transfers'
        	AND src_name='${event}'
          AND block_num BETWEEN $1 AND $2
          AND chain_id=$4
        ON CONFLICT DO NOTHING`,
      [from, to, blockTsOffset, chainID]
    );
    elapsedMs = (performance.now() - startMs) | 0;
    console.log(`[SHOVEL] s^2 add transfers: ${from}-${to} in ${elapsedMs}ms`);

    // Finally, add userops
    await pg.query(
      `INSERT INTO daimo_ops (
        chain_id,
        block_num,
        block_hash,
        block_ts,
        tx_idx,
        tx_hash,
        log_idx,
        op_hash,
        op_sender,
        op_paymaster,
        op_nonce,
        op_success,
        op_actual_gas_cost,
        op_actual_gas_used
      )
      SELECT 
        chain_id,
        block_num,
        block_hash,
        block_num * 2 + $3 as block_ts,
        tx_idx,
        tx_hash,
        log_idx,
        op_hash,
        op_sender,
        op_paymaster,
        op_nonce,
        op_success,
        op_actual_gas_cost,
        op_actual_gas_used
      FROM erc4337_user_op
      WHERE ig_name='erc4337_user_op'
        AND src_name='${event}'
        AND block_num BETWEEN $1 AND $2
        AND chain_id=$4
        AND op_sender IN (select addr from names)
      ON CONFLICT DO NOTHING;`,
      [from, to, blockTsOffset, chainID]
    );
    elapsedMs = (performance.now() - startMs) | 0;
    console.log(`[SHOVEL] s^2 add userops: ${from}-${to} in ${elapsedMs}ms`);
  }
}
