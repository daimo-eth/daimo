import { ProfileLinkID, TagRedirectEvent, assertNotNull } from "@daimo/common";
import { Kysely, PostgresDialect } from "kysely";
import { ClientConfig, Pool, PoolConfig } from "pg";
import { Address, Hex, getAddress } from "viem";

import { DB as ApiDB } from "../codegen/dbApi";
import { getEnvApi } from "../env";
import { PushNotification } from "../server/pushNotifier";

/** Credentials come from env.PGURL, defaults to localhost & no auth. */
function getApiDBPoolConfigFromEnv(): PoolConfig {
  const dbConfig: ClientConfig = {
    connectionString: getEnvApi().PGURL,
    connectionTimeoutMillis: 10000,
    query_timeout: 5000,
    statement_timeout: 5000,
    database: getEnvApi().PGURL == null ? "daimo" : undefined,
  };

  return {
    ...dbConfig,
    min: 1,
    max: 8,
    idleTimeoutMillis: 60000,
  };
}

export class DB {
  private pool: Pool;
  public readonly kdb: Kysely<ApiDB>;

  constructor(poolConfig?: PoolConfig) {
    if (poolConfig == null) poolConfig = getApiDBPoolConfigFromEnv();
    this.pool = new Pool(poolConfig);
    this.kdb = new Kysely<ApiDB>({
      dialect: new PostgresDialect({ pool: this.pool }),
    });
  }

  getStatus() {
    const { idleCount, totalCount, waitingCount } = this.pool;
    return {
      idleCount,
      totalCount,
      waitingCount,
    };
  }

  async migrateDB() {
    console.log(`[DB] migrating API DB`);
    const startMs = performance.now();
    let success = false;
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS pushtoken (
          pushtoken VARCHAR(64) PRIMARY KEY,
          address CHAR(42) NOT NULL
        );
        CREATE INDEX IF NOT EXISTS pushtoken_address ON pushtoken (address);
        
        CREATE TABLE IF NOT EXISTS invitecode (
          code VARCHAR(64) PRIMARY KEY,
          use_count INT NOT NULL,
          max_uses INT NOT NULL DEFAULT 1
        );
        ALTER TABLE invitecode ADD COLUMN IF NOT EXISTS zupass_email VARCHAR DEFAULT NULL;
        ALTER TABLE invitecode ADD COLUMN IF NOT EXISTS inviter CHAR(42) DEFAULT NULL;
        ALTER TABLE invitecode ADD COLUMN IF NOT EXISTS bonus_cents_invitee INT DEFAULT 0 NOT NULL;
        ALTER TABLE invitecode ADD COLUMN IF NOT EXISTS bonus_cents_inviter INT DEFAULT 0 NOT NULL;

        CREATE TABLE IF NOT EXISTS name_blacklist (
          name VARCHAR(32) PRIMARY KEY
        );

        -- These accounts are allowed to use our sponsoring paymaster.
        -- We only include accounts created via a valid invite code.
        CREATE TABLE IF NOT EXISTS paymaster_whitelist (
          name VARCHAR(32) PRIMARY KEY
        );

        CREATE TABLE IF NOT EXISTS linked_account (
          linked_type VARCHAR(32) NOT NULL, -- eg "farcaster"
          linked_id VARCHAR(64), -- eg "0x123a..."
          address CHAR(42), -- our Daimo account address
          account_json TEXT, -- the linked social media account
          PRIMARY KEY (address, linked_type),
          UNIQUE (linked_type, linked_id)
        );

        CREATE TABLE IF NOT EXISTS offchain_action (
          id SERIAL PRIMARY KEY,
          address CHAR(42), -- our Daimo account address
          time BIGINT NOT NULL, -- action timestamp, extracted from action
          type VARCHAR(32) NOT NULL, -- action type, extracted from action
          action_json TEXT NOT NULL, -- action, ERC1271-signed by the account
          signature_hex TEXT NOT NULL,
          UNIQUE (address, time, type)
        );

        CREATE TABLE IF NOT EXISTS invite_graph (
          invitee CHAR(42) PRIMARY KEY,
          inviter CHAR(42) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );

        -- Used to prevent double-claiming faucet bonuses
        CREATE TABLE IF NOT EXISTS used_faucet_attestations (
          attestation CHAR(184) PRIMARY KEY
        );
        
        CREATE TABLE IF NOT EXISTS tag_redirect (
          tag VARCHAR(32) PRIMARY KEY, -- tag, eg "foo" in daimo.com/l/t/foo
          link VARCHAR(256) NOT NULL, -- redirect URL
          update_token VARCHAR(64) DEFAULT NULL -- if set, the link can only be updated with this token
        );

        CREATE TABLE IF NOT EXISTS tag_redirect_history (
          id SERIAL PRIMARY KEY,
          time TIMESTAMP NOT NULL DEFAULT NOW(),
          tag VARCHAR(32) NOT NULL, -- new or existing tag
          link VARCHAR(256) NOT NULL, -- new link
          update_token VARCHAR(64) DEFAULT NULL -- token used for this update
        );

        CREATE TABLE IF NOT EXISTS payment_memo (
          ophash_hex VARCHAR(66) PRIMARY KEY,
          memo TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS declined_requests (
          request_id VARCHAR(128) PRIMARY KEY,
          decliner CHAR(42) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );

        --
        -- Ensure every table tracks creation time.
        --
        ALTER TABLE invitecode ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
        ALTER TABLE invite_graph ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
        ALTER TABLE payment_memo ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
        ALTER TABLE offchain_action ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
        ALTER TABLE linked_account ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
        ALTER TABLE used_faucet_attestations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

        CREATE TABLE IF NOT EXISTS waitlist (
          email VARCHAR(128) PRIMARY KEY,
          name VARCHAR(128) NOT NULL,
          socials VARCHAR(128) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );

        --
        -- External API cache for reverse ENS lookups, etc
        --
        CREATE TABLE IF NOT EXISTS external_api_cache (
          id SERIAL PRIMARY KEY,
          api_type VARCHAR(32) NOT NULL,
          key VARCHAR(128) NOT NULL,
          value TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL,
          updated_at TIMESTAMP NOT NULL,
          expires_at TIMESTAMP NOT NULL,

          UNIQUE (api_type, key)
        );

        CREATE INDEX IF NOT EXISTS expires_at_idx ON external_api_cache (expires_at);

        --
        -- Never double-send a push notification
        --
        CREATE TABLE IF NOT EXISTS push_notification (
          id SERIAL PRIMARY KEY,
          created_at TIMESTAMP NOT NULL,
          address CHAR(42) NOT NULL,
          push_key TEXT NOT NULL,
          push_json TEXT NOT NULL,

          UNIQUE (address, push_key)
        );
      `);
      success = true;
    } catch (e) {
      console.error(`[DB] error migrating API DB: ${e}`);
      throw e;
    } finally {
      const status = success ? "success" : "error";
      const elapsedMs = (performance.now() - startMs) | 0;
      console.log(`[DB] migration ${status} in ${elapsedMs}ms`);
    }
  }

  async loadPushTokens(): Promise<PushTokenRow[]> {
    console.log(`[DB] loading push tokens`);
    const result = await this.pool.query<PushTokenRow>(
      `SELECT address, pushtoken FROM pushtoken`
    );

    console.log(`[DB] ${result.rows.length} push tokens`);
    return result.rows;
  }

  async savePushToken(token: PushTokenRow) {
    console.log(`[DB] inserting auth token`);
    await this.pool.query(
      `INSERT INTO pushtoken (pushtoken, address) VALUES ($1, $2)
       ON CONFLICT (pushtoken) DO UPDATE SET address = $2`,
      [token.pushtoken, token.address]
    );
  }

  async loadTagRedirect(tag: string): Promise<TagRedirectRow | null> {
    console.log(`[DB] loading tag redirect: ${tag}`);
    const result = await this.pool.query<TagRedirectRow>(
      `SELECT tag, link, update_token FROM tag_redirect WHERE tag = $1`,
      [tag]
    );
    return result.rows[0] || null;
  }

  async loadTagRedirectHist(tag: string): Promise<TagRedirectEvent[]> {
    console.log(`[DB] loading tag redirect history: ${tag}`);
    const result = await this.pool.query(
      `SELECT tag, link, time
       FROM tag_redirect_history WHERE tag = $1
       ORDER BY time DESC LIMIT 10`,
      [tag]
    );

    return result.rows.map((row) => ({
      time: Math.floor(new Date(row.time).getTime() / 1000),
      tag: row.tag,
      link: row.link,
    }));
  }

  async saveTagRedirect(
    tag: string,
    link: string,
    updateToken?: string
  ): Promise<TagRedirectRow> {
    console.log(`[DB] inserting tag redirect: ${tag} -> ${link}`);
    const queryParams = [tag, link];
    let query = `INSERT INTO tag_redirect (tag, link) VALUES ($1, $2)
                 ON CONFLICT (tag) DO UPDATE SET link = $2
                 RETURNING *`;

    if (updateToken !== undefined) {
      query = `INSERT INTO tag_redirect (tag, link, update_token) VALUES ($1, $2, $3)
               ON CONFLICT (tag) DO UPDATE SET link = $2, update_token = $3
               RETURNING *`;
      queryParams.push(updateToken);
    }

    const res = await this.pool.query(query, queryParams);

    if (res.rowCount && res.rowCount > 0) {
      let historyQuery = `INSERT INTO tag_redirect_history (tag, link) VALUES ($1, $2)`;

      if (updateToken !== undefined) {
        historyQuery = `INSERT INTO tag_redirect_history (tag, link, update_token) VALUES ($1, $2, $3)`;
      }

      await this.pool.query(historyQuery, queryParams);
    }

    return res.rows[0];
  }

  async saveOffchainAction(row: OffchainActionRow) {
    console.log(
      `[DB] inserting offchain action ${row.type} ${row.time} ${row.address}`
    );
    await this.pool.query(
      `INSERT INTO offchain_action (address, time, type, action_json, signature_hex)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        row.address,
        row.time,
        row.type,
        row.action_json,
        row.signature_hex,
      ] as any
    );
  }

  async saveLinkedAccount(row: LinkedAccountRow) {
    console.log(
      `[DB] inserting linked_account: ${row.linked_type} ${row.linked_id} ${row.address}`
    );
    const client = await this.pool.connect();

    try {
      await client.query(
        `DELETE FROM linked_account
       WHERE (linked_type = $1 AND linked_id = $2)
       OR (linked_type = $1 AND address = $3)`,
        [row.linked_type, row.linked_id, row.address]
      );

      await client.query(
        `INSERT INTO linked_account (linked_type, linked_id, address, account_json)
       VALUES ($1, $2, $3, $4)`,
        [row.linked_type, row.linked_id, row.address, row.account_json]
      );
    } finally {
      client.release();
    }
  }

  async deleteLinkedAccount(linkID: ProfileLinkID) {
    console.log(`[DB] deleting linked_account: ${linkID.type} ${linkID.id}`);
    await this.pool.query(
      `DELETE FROM linked_account WHERE linked_type = $1 AND linked_id = $2 AND address = $3`,
      [linkID.type, linkID.id, linkID.addr]
    );
  }

  async loadLinkedAccounts(): Promise<LinkedAccountRow[]> {
    console.log(`[DB] loading linked accounts`);
    const result = await this.pool.query<LinkedAccountRow>(
      `SELECT linked_type, linked_id, address, account_json FROM linked_account`
    );

    console.log(`[DB] ${result.rows.length} linked accounts`);
    return result.rows;
  }

  async loadNameBlacklist(): Promise<Set<string>> {
    console.log(`[DB] loading name blacklist`);
    const result = await this.pool.query<{ name: string }>(
      `SELECT name FROM name_blacklist`
    );

    console.log(`[DB] ${result.rows.length} blacklisted names`);
    return new Set(result.rows.map((row) => row.name));
  }

  async checkPaymasterWhitelist(name: string): Promise<boolean> {
    console.log(`[DB] paymaster whitelist: checking ${name}...`);
    const result = await this.pool.query<{ name: string }>(
      `SELECT name FROM paymaster_whitelist WHERE name = $1`,
      [name]
    );

    const ret = result.rows.length > 0;
    console.log(`[DB] paymaster whitelist: ${ret ? "allow" : "DENY"} ${name}`);
    return ret;
  }

  async insertPaymasterWhiteslist(name: string) {
    console.log(`[DB] inserting into paymaster whitelist: ${name}`);
    await this.pool.query(
      `INSERT INTO paymaster_whitelist (name) VALUES ($1)
       ON CONFLICT (name) DO NOTHING`,
      [name]
    );
  }

  async loadInviteCode(code: string): Promise<InviteCodeRow | null> {
    console.log(`[DB] loading invite code ${code}`);
    const result = await this.pool.query<RawInviteCodeRow>(
      `SELECT code, created_at, use_count, max_uses, zupass_email, inviter, bonus_cents_invitee, bonus_cents_inviter 
      FROM invitecode WHERE code = $1`,
      [code]
    );

    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      code: row.code,
      createdAt: dateToUnix(row.created_at),
      useCount: row.use_count,
      maxUses: row.max_uses,
      zupassEmail: row.zupass_email,
      inviter: row.inviter ? getAddress(row.inviter) : null,
      bonusDollarsInvitee: row.bonus_cents_invitee / 100,
      bonusDollarsInviter: row.bonus_cents_inviter / 100,
    };
  }

  async saveInviteCode(code: InviteCodeRow) {
    console.log(`[DB] inserting invite code`);
    await this.pool.query(
      `INSERT INTO invitecode (code, use_count, max_uses, zupass_email) VALUES ($1, $2, $3, $4)
       ON CONFLICT (code) DO UPDATE SET use_count = $2, max_uses = $3, zupass_email = $4`,
      [code.code, code.useCount, code.maxUses, code.zupassEmail] as any
    );
  }

  async incrementInviteCodeUseCount(code: string) {
    console.log(`[DB] incrementing invite code use count`);
    await this.pool.query(
      `UPDATE invitecode SET use_count = use_count + 1 WHERE code = $1`,
      [code]
    );
  }

  // Returns the invite code for a sender with most available uses left.
  async getBestInviteCodeForSender(
    address: Address
  ): Promise<string | undefined> {
    console.log(`[DB] getting invite code for address`);
    const result = await this.pool.query<{ code: string }>(
      `SELECT code FROM invitecode WHERE inviter = $1 ORDER BY max_uses - use_count DESC LIMIT 1`,
      [address]
    );

    return result.rows.length > 0 ? result.rows[0].code : undefined;
  }

  async loadInviteGraph(): Promise<InviteGraphRow[]> {
    console.log(`[DB] loading invite graph`);
    const result = await this.pool.query<InviteGraphRow>(
      `SELECT invitee, inviter FROM invite_graph ORDER BY created_at`
    );

    console.log(`[DB] ${result.rows.length} invite graph rows`);
    return result.rows;
  }

  async insertInviteGraph(rows: InviteGraphRow) {
    console.log(`[DB] inserting invite graph`);
    await this.pool.query(
      `INSERT INTO invite_graph (invitee, inviter) VALUES ($1, $2)`,
      [rows.invitee, rows.inviter]
    );
  }

  async insertInviteCode(row: InsertInviteCodeArgs) {
    console.log(`[DB] inserting invite code: ${JSON.stringify(row)}`);
    const res = await this.pool.query<[], any[]>(
      `
      INSERT INTO invitecode (code, use_count, max_uses, inviter, bonus_cents_invitee, bonus_cents_inviter)
      VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (code) DO NOTHING`,
      [
        row.code,
        0,
        row.maxUses,
        row.inviter,
        Math.round(row.bonusDollarsInvitee * 100),
        Math.round(row.bonusDollarsInviter * 100),
      ]
    );
    return assertNotNull(res.rowCount) > 0;
  }

  async updateInviteCode(row: UpdateInviteCodeArgs) {
    console.log(`[DB] updating invite code: ${JSON.stringify(row)}`);
    let res;
    if (row.maxUses != null) {
      res = await this.pool.query<[], any[]>(
        `UPDATE invitecode SET max_uses = $1 WHERE code = $2`,
        [row.maxUses, row.code]
      );
    }
    if (row.bonusDollarsInviter != null) {
      res = await this.pool.query<[], any[]>(
        `UPDATE invitecode SET bonus_cents_inviter = $1 WHERE code = $2`,
        [row.bonusDollarsInviter * 100, row.code]
      );
    }
    if (row.bonusDollarsInvitee != null) {
      res = await this.pool.query<[], any[]>(
        `UPDATE invitecode SET bonus_cents_invitee = $1 WHERE code = $2`,
        [row.bonusDollarsInvitee * 100, row.code]
      );
    }

    return res && assertNotNull(res.rowCount) > 0;
  }

  async insertFaucetAttestation(attestation: string) {
    console.log(`[DB] inserting faucet attestation`);
    await this.pool.query(
      `INSERT INTO used_faucet_attestations (attestation) VALUES ($1)
       ON CONFLICT (attestation) DO NOTHING`,
      [attestation]
    );
  }

  async isFaucetAttestationUsed(attestation: string): Promise<boolean> {
    console.log(`[DB] checking faucet attestation`);
    const result = await this.pool.query<{ attestation: string }>(
      `SELECT attestation FROM used_faucet_attestations WHERE attestation = $1`,
      [attestation]
    );

    return result.rows.length > 0;
  }

  async loadPaymentMemos(): Promise<PaymentMemoRow[]> {
    console.log(`[DB] loading payment memos`);
    const result = await this.pool.query<RawPaymentMemoRow>(
      `SELECT ophash_hex, memo FROM payment_memo`
    );
    console.log(`[DB] loaded ${result.rows.length} payment memo rows`);
    return result.rows.map((row) => ({
      opHash: row.ophash_hex as Hex,
      memo: row.memo,
    }));
  }

  async insertPaymentMemo(row: PaymentMemoRow) {
    console.log(`[DB] inserting payment memos`);
    await this.pool.query(
      `INSERT INTO payment_memo (ophash_hex, memo) VALUES ($1, $2)`,
      [row.opHash, row.memo]
    );
  }

  async loadDeclinedRequests(): Promise<DeclinedRequestRow[]> {
    console.log(`[DB] loading declined requests`);
    const result = await this.pool.query<RawDeclinedRequestRow>(
      `SELECT request_id, decliner, created_at FROM declined_requests`
    );

    console.log(`[DB] ${result.rows.length} declined request rows`);
    return result.rows.map((row) => ({
      requestId: BigInt(row.request_id),
      decliner: row.decliner,
      createdAt: dateToUnix(row.created_at),
    }));
  }

  async insertDeclinedRequest(requestId: bigint, decliner: string) {
    console.log(`[DB] inserting declined request`);
    await this.pool.query(
      `INSERT INTO declined_requests (request_id, decliner) VALUES ($1, $2)`,
      [requestId.toString(), decliner]
    );
  }

  async insertWaitlist(name: string, email: string, socials: string) {
    console.log(`[DB] inserting waitlist`);
    await this.pool.query(
      `INSERT INTO waitlist (name, email, socials) VALUES ($1, $2, $3)`,
      [name, email, socials]
    );
  }

  /// Inserts a new push notification. Returns rows affected = 1 or 0 if dupe.
  async tryInsertPushNotification(push: PushNotification) {
    console.log(`[DB] inserting push notif`);
    const res = await this.kdb
      .insertInto("push_notification")
      .values({
        created_at: new Date(),
        address: push.address,
        push_key: push.key,
        push_json: JSON.stringify(push.expoPush),
      })
      .onConflict((b) => b.doNothing())
      .executeTakeFirst();
    return Number(res.numInsertedOrUpdatedRows || 0);
  }
}

function dateToUnix(d: Date): number {
  return Math.floor(d.getTime() / 1000);
}

interface PushTokenRow {
  pushtoken: string;
  address: string;
}

export interface InviteCodeRow {
  code: string;
  createdAt: number;
  useCount: number;
  maxUses: number;
  zupassEmail: string | null;
  inviter: Address | null;
  bonusDollarsInvitee: number;
  bonusDollarsInviter: number;
}

export interface InsertInviteCodeArgs {
  code: string;
  maxUses: number;
  inviter: Address | null;
  bonusDollarsInvitee: number;
  bonusDollarsInviter: number;
}

export interface UpdateInviteCodeArgs {
  code: string;
  maxUses?: number;
  bonusDollarsInvitee?: number;
  bonusDollarsInviter?: number;
}

interface RawInviteCodeRow {
  code: string;
  created_at: Date;
  use_count: number;
  max_uses: number;
  zupass_email: string | null;
  inviter: string | null;
  bonus_cents_invitee: number; // in cents so we can use INT Postgres type
  bonus_cents_inviter: number;
}

export interface InviteGraphRow {
  invitee: Address;
  inviter: Address;
}

interface LinkedAccountRow {
  linked_type: string;
  linked_id: string;
  address: string;
  account_json: string;
}

interface OffchainActionRow {
  id: number;
  address: string;
  time: number;
  type: string;
  action_json: string;
  signature_hex: string;
}

interface TagRedirectRow {
  tag: string;
  link: string;
  update_token: string | null;
}

interface RawPaymentMemoRow {
  ophash_hex: string;
  memo: string;
}

export interface PaymentMemoRow {
  opHash: Hex;
  memo: string;
}

interface RawDeclinedRequestRow {
  request_id: string;
  decliner: string;
  created_at: Date;
}

interface DeclinedRequestRow {
  requestId: bigint;
  decliner: string;
  createdAt: number;
}
