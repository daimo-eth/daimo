import type { ClientConfig } from "pg";

export const SHOVEL_DB_CONFIG: ClientConfig = {
  connectionString: process.env.SHOVEL_DATABASE_URL,
  connectionTimeoutMillis: 20000,
  query_timeout: 20000,
  statement_timeout: 20000,
  database: process.env.SHOVEL_DATABASE_URL == null ? "shovel" : undefined,
};
