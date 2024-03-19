import { ProfileLinkID, TagRedirectEvent } from "@daimo/common";
import { Client, ClientConfig, Pool, PoolConfig } from "pg";
import { Address, getAddress } from "viem";

/** Credentials come from env.PGURL, defaults to localhost & no auth. */
const dbConfig: ClientConfig = {
  connectionString: process.env.PGURL,
  connectionTimeoutMillis: 5000,
  query_timeout: 5000,
  statement_timeout: 5000,
  database: process.env.PGURL == null ? "daimo" : undefined,
};

const poolConfig: PoolConfig = {
  ...dbConfig,
  max: 8,
  idleTimeoutMillis: 60000,
};

export class DB {
  private pool: Pool;

  constructor() {
    this.pool = new Pool(poolConfig);
  }

  getStatus() {
    const { idleCount, totalCount, waitingCount } = this.pool;
    return {
      idleCount,
      totalCount,
      waitingCount,
    };
  }

  async createTables() {
    console.log(`[DB] connecting`);
    const client = new Client(dbConfig);
    await client.connect();

    console.log("[DB] connected, creating tables if necessary");
    await client.query(`
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
      `);
    await client.end();
  }

  async loadPushTokens(): Promise<PushTokenRow[]> {
    console.log(`[DB] loading push tokens`);
    const client = await this.pool.connect();
    const result = await client.query<PushTokenRow>(
      `SELECT address, pushtoken FROM pushtoken`
    );
    client.release();

    console.log(`[DB] ${result.rows.length} push tokens`);
    return result.rows;
  }

  async savePushToken(token: PushTokenRow) {
    console.log(`[DB] inserting auth token`);
    const client = await this.pool.connect();
    await client.query(
      `INSERT INTO pushtoken (pushtoken, address) VALUES ($1, $2)
       ON CONFLICT (pushtoken) DO UPDATE SET address = $2`,
      [token.pushtoken, token.address]
    );
    client.release();
  }

  async loadTagRedirect(tag: string): Promise<TagRedirectRow | null> {
    console.log(`[DB] loading tag redirect: ${tag}`);
    const client = await this.pool.connect();
    const result = await client.query<TagRedirectRow>(
      `SELECT tag, link, update_token FROM tag_redirect WHERE tag = $1`,
      [tag]
    );
    client.release();
    return result.rows[0] || null;
  }

  async loadTagRedirectHist(tag: string): Promise<TagRedirectEvent[]> {
    console.log(`[DB] loading tag redirect history: ${tag}`);
    const client = await this.pool.connect();
    const result = await client.query(
      `SELECT tag, link, time
       FROM tag_redirect_history WHERE tag = $1
       ORDER BY time DESC LIMIT 10`,
      [tag]
    );
    client.release();
    return result.rows.map((row) => ({
      time: Math.floor(new Date(row.time).getTime() / 1000),
      tag: row.tag,
      link: row.link,
    }));
  }

  async saveTagRedirect(tag: string, link: string) {
    console.log(`[DB] inserting tag redirect: ${tag} -> ${link}`);
    const client = await this.pool.connect();
    const res = await client.query(
      `INSERT INTO tag_redirect (tag, link) VALUES ($1, $2)
       ON CONFLICT (tag) DO UPDATE SET link = $2`,
      [tag, link]
    );
    if (res.rowCount && res.rowCount > 0) {
      await client.query(
        `INSERT INTO tag_redirect_history (tag, link) VALUES ($1, $2)`,
        [tag, link]
      );
    }
    client.release();
  }

  async saveOffchainAction(row: OffchainActionRow) {
    console.log(
      `[DB] inserting offchain action ${row.type} ${row.time} ${row.address}`
    );
    const client = await this.pool.connect();
    await client.query(
      `INSERT INTO offchain_action (address, time, type, action_json, signature_hex)
       VALUES ($1, $2, $3, $4, $5)`,
      //@ts-ignore
      [row.address, row.time, row.type, row.action_json, row.signature_hex]
    );
    client.release();
  }

  async saveLinkedAccount(row: LinkedAccountRow) {
    console.log(
      `[DB] inserting linked_account: ${row.linked_type} ${row.linked_id} ${row.address}`
    );
    const client = await this.pool.connect();

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
    client.release();
  }

  async deleteLinkedAccount(linkID: ProfileLinkID) {
    console.log(`[DB] deleting linked_account: ${linkID.type} ${linkID.id}`);
    const client = await this.pool.connect();
    await client.query(
      `DELETE FROM linked_account WHERE linked_type = $1 AND linked_id = $2 AND address = $3`,
      [linkID.type, linkID.id, linkID.addr]
    );
    client.release();
  }

  async loadLinkedAccounts(): Promise<LinkedAccountRow[]> {
    console.log(`[DB] loading linked accounts`);
    const client = await this.pool.connect();
    const result = await client.query<LinkedAccountRow>(
      `SELECT linked_type, linked_id, address, account_json FROM linked_account`
    );
    client.release();

    console.log(`[DB] ${result.rows.length} linked accounts`);
    return result.rows;
  }

  async loadNameBlacklist(): Promise<Set<string>> {
    console.log(`[DB] loading name blacklist`);
    const client = await this.pool.connect();
    const result = await client.query<{ name: string }>(
      `SELECT name FROM name_blacklist`
    );
    client.release();

    console.log(`[DB] ${result.rows.length} blacklisted names`);
    return new Set(result.rows.map((row) => row.name));
  }

  async checkPaymasterWhitelist(name: string): Promise<boolean> {
    console.log(`[DB] paymaster whitelist: checking ${name}...`);
    const client = await this.pool.connect();
    const result = await client.query<{ name: string }>(
      `SELECT name FROM paymaster_whitelist WHERE name = $1`,
      [name]
    );
    client.release();

    const ret = result.rows.length > 0;
    console.log(`[DB] paymaster whitelist: ${ret ? "allow" : "DENY"} ${name}`);
    return ret;
  }

  async insertPaymasterWhiteslist(name: string) {
    console.log(`[DB] inserting into paymaster whitelist: ${name}`);
    const client = await this.pool.connect();
    await client.query(
      `INSERT INTO paymaster_whitelist (name) VALUES ($1)
       ON CONFLICT (name) DO NOTHING`,
      [name]
    );
    client.release();
  }

  async loadInviteCode(code: string): Promise<InviteCodeRow | null> {
    console.log(`[DB] loading invite code ${code}`);
    const client = await this.pool.connect();
    const result = await client.query<RawInviteCodeRow>(
      `SELECT code, use_count, max_uses, zupass_email, inviter, bonus_cents_invitee, bonus_cents_inviter FROM invitecode WHERE code = $1`,
      [code]
    );
    client.release();

    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      code: row.code,
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
    const client = await this.pool.connect();
    await client.query(
      `INSERT INTO invitecode (code, use_count, max_uses, zupass_email) VALUES ($1, $2, $3, $4)
       ON CONFLICT (code) DO UPDATE SET use_count = $2, max_uses = $3, zupass_email = $4`,
      //@ts-ignore
      [code.code, code.useCount, code.maxUses, code.zupassEmail]
    );
    client.release();
  }

  async incrementInviteCodeUseCount(code: string) {
    console.log(`[DB] incrementing invite code use count`);
    const client = await this.pool.connect();
    await client.query(
      `UPDATE invitecode SET use_count = use_count + 1 WHERE code = $1`,
      [code]
    );
    client.release();
  }

  // Returns the invite code for a sender with most available uses left.
  async getBestInviteCodeForSender(
    address: Address
  ): Promise<string | undefined> {
    console.log(`[DB] getting invite code for address`);
    const client = await this.pool.connect();
    const result = await client.query<{ code: string }>(
      `SELECT code FROM invitecode WHERE inviter = $1 ORDER BY max_uses - use_count DESC LIMIT 1`,
      [address]
    );
    client.release();

    return result.rows.length > 0 ? result.rows[0].code : undefined;
  }

  async loadInviteGraph(): Promise<InviteGraphRow[]> {
    console.log(`[DB] loading invite graph`);
    const client = await this.pool.connect();
    const result = await client.query<InviteGraphRow>(
      `SELECT invitee, inviter FROM invite_graph ORDER BY created_at`
    );
    client.release();

    console.log(`[DB] ${result.rows.length} invite graph rows`);
    return result.rows;
  }

  async insertInviteGraph(rows: InviteGraphRow) {
    console.log(`[DB] inserting invite graph`);
    const client = await this.pool.connect();
    await client.query(
      `INSERT INTO invite_graph (invitee, inviter) VALUES ($1, $2)`,
      [rows.invitee, rows.inviter]
    );
    client.release();
  }

  async insertFaucetAttestation(attestation: string) {
    console.log(`[DB] inserting faucet attestation`);
    const client = await this.pool.connect();
    await client.query(
      `INSERT INTO used_faucet_attestations (attestation) VALUES ($1)
       ON CONFLICT (attestation) DO NOTHING`,
      [attestation]
    );
    client.release();
  }

  async isFaucetAttestationUsed(attestation: string): Promise<boolean> {
    console.log(`[DB] checking faucet attestation`);
    const client = await this.pool.connect();
    const result = await client.query<{ attestation: string }>(
      `SELECT attestation FROM used_faucet_attestations WHERE attestation = $1`,
      [attestation]
    );
    client.release();

    return result.rows.length > 0;
  }
}

interface PushTokenRow {
  pushtoken: string;
  address: string;
}

export interface InviteCodeRow {
  code: string;
  useCount: number;
  maxUses: number;
  zupassEmail: string | null;
  inviter: Address | null;
  bonusDollarsInvitee: number;
  bonusDollarsInviter: number;
}

interface RawInviteCodeRow {
  code: string;
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
