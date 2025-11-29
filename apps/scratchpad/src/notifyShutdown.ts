import "dotenv/config";
import { Expo } from "expo-server-sdk";
import { ClientConfig, Pool, PoolConfig } from "pg";
import readline from "readline";

type PushTokenRow = { address: string; pushtoken: string };

const firstAddrs = [
  "0x6af35dF65594398726140cf1bf0339e94c7A817F",
  "0x4D350d99364634e07B01a9986662787DD3755F0A",
];

async function main() {
  const expo = new Expo();

  const all = await loadAllPushTokens();
  const filtered = all;

  const uniqueAddresses = new Set(filtered.map((r) => r.address.toLowerCase()));
  console.log(`addresses: ${uniqueAddresses.size}, tokens: ${filtered.length}`);

  const proceed = await promptYesNo("continue sending? (y/N) ");
  if (!proceed) {
    console.log("aborted");
    return;
  }

  const title = "Goodbye, Daimo app";
  const body =
    "Thanks for your support! We are sunsetting the Daimo app on Jan 31, 2026. Please withdraw funds.";

  // Validate tokens and prepare messages
  const validTokens = filtered
    .sort((a, b) => {
      const aFirst = firstAddrs.includes(a.address) ? 0 : 1;
      const bFirst = firstAddrs.includes(b.address) ? 0 : 1;
      const ret = aFirst - bFirst;
      if (ret !== 0) return ret;
      return a.address.localeCompare(b.address);
    })
    .filter((t) => Expo.isExpoPushToken(t.pushtoken));

  let sent = 0;
  for (const batch of chunk(validTokens, 90)) {
    console.log(
      `sending ${batch.length} notifs starting with ${batch[0].address}...`
    );
    const messages = batch.map((row) => ({
      to: row.pushtoken,
      badge: 1,
      title,
      body,
      sound: "default" as const,
      priority: "high" as const,
    }));
    try {
      const tickets = await expo.sendPushNotificationsAsync(messages);
      sent += tickets.length;
    } catch (err) {
      console.error("failed to send a batch");
      console.error(String(err));
    }
    console.log(`sent ${sent}/${validTokens.length}; sleeping`);
    await new Promise((resolve) => setTimeout(resolve, 100_000));
  }

  console.log(`done, sent to ${sent} tokens`);
}

function getApiDBPoolConfigFromEnv(): PoolConfig {
  const dbConfig: ClientConfig = {
    connectionString: process.env.PGURL,
    connectionTimeoutMillis: 10000,
    query_timeout: 5000,
    statement_timeout: 5000,
  };

  return {
    ...dbConfig,
    min: 1,
    max: 8,
    idleTimeoutMillis: 60000,
  };
}

async function loadAllPushTokens(): Promise<PushTokenRow[]> {
  const config = getApiDBPoolConfigFromEnv();
  console.log(`[DB] config: ${JSON.stringify(config)}`);
  const pool = new Pool(config);
  try {
    const res = await pool.query<PushTokenRow>(
      `SELECT address, pushtoken FROM public.pushtoken`
    );
    return res.rows;
  } finally {
    await pool.end();
  }
}

function promptYesNo(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      const a = answer.trim().toLowerCase();
      resolve(a === "y" || a === "yes");
    });
  });
}

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size)
    chunks.push(arr.slice(i, i + size));
  return chunks;
}

main().catch((e) => {
  console.error("error running notify script");
  console.error(String(e?.message ?? e));
});
