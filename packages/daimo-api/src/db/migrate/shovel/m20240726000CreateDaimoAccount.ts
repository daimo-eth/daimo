import { Kysely, Migration } from "kysely";

export const Migration20240726000CreateDaimoAccount: Migration = {
  up: async (db: Kysely<any>) => {
    db.schema
      .createTable("daimo_account")
      .addColumn("addr", "bytea", (c) => c.primaryKey().notNull())
      .addColumn("created_at", "bigint", (c) => c.notNull())
      .addColumn("account_version", "text", (c) => c.notNull())
      .addColumn("home_chain", "integer", (c) => c.notNull())
      .addColumn("home_coin", "bytea", (c) => c.notNull())
      .addColumn("swapper", "bytea")
      .addColumn("bridger", "bytea")
      .addColumn("key_slot", "integer")
      .addColumn("key_data", "bytea")
      .addColumn("salt", "numeric")
      .addColumn("name", "text", (c) => c.unique())
      .execute();
  },
};
