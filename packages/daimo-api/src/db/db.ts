import { Client, ClientConfig, Pool, PoolConfig } from "pg";

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
}

interface PushTokenRow {
  pushtoken: string;
  address: string;
}
