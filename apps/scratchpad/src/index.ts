// https://api.pimlico.io/v1/goerli/rpc?apikey=70ecef54-a28e-4e96-b2d3-3ad67fbc1b07

import { AppRouter } from "@daimo/api";
import { getViemClientFromEnv } from "@daimo/api/src/chain";
import { CoinIndexer } from "@daimo/api/src/contract/coinIndexer";
import { NameRegistry } from "@daimo/api/src/contract/nameRegistry";
import { OpIndexer } from "@daimo/api/src/contract/opIndexer";
import { guessTimestampFromNum } from "@daimo/common";
import { nameRegistryProxyConfig, tokenMetadata } from "@daimo/contract";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import csv from "csvtojson";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

import { checkAccount, checkAccountDesc } from "./checkAccount";
import { createAccount, createAccountDesc } from "./createAccount";
import { pushNotify, pushNotifyDesc } from "./pushNotify";

main()
  .then(() => console.log("Done"))
  .catch(console.error);

async function main() {
  const commands = [
    { name: "default", desc: defaultDesc(), fn: defaultScript },
    { name: "metrics", desc: metricsDesc(), fn: metrics },
    { name: "trpc", desc: trpcDesc(), fn: trpc },
    { name: "create", desc: createAccountDesc(), fn: createAccount },
    { name: "check", desc: checkAccountDesc(), fn: checkAccount },
    { name: "mailing-list", desc: mailingListDesc(), fn: mailingList },
    { name: "push-notify", desc: pushNotifyDesc(), fn: pushNotify },
  ];

  const cmdName = process.argv[2] || "default";
  const cmd = commands.find((c) => c.name === cmdName);
  if (cmdName == null || cmdName === "help") {
    console.log(`Usage: scratchpad <command>`);
    commands.forEach((c) => console.log(`  ${c.name}: ${c.desc}`));
  } else if (!cmd) {
    console.error(`Unknown command: ${cmdName}. Try 'help'`);
  } else {
    const promise: Promise<void> = cmd.fn();
    await promise;
  }
}

function defaultDesc() {
  return `Scratchpad for quick tests`;
}

async function defaultScript() {
  console.log("Hello, world");
}

function metricsDesc() {
  return `Print weekly Daimo usage metrics`;
}

async function metrics() {
  const vc = getViemClientFromEnv();
  await vc.init();

  console.log(`[METRICS] using wallet ${vc.walletClient.account.address}`);
  const nameReg = new NameRegistry(vc);
  const opIndexer = new OpIndexer(vc);
  const coinIndexer = new CoinIndexer(vc, opIndexer);

  console.log(`[METRICS] initializing indexers...`);
  await Promise.all([nameReg.init(), opIndexer.init()]);
  await Promise.all([coinIndexer.init()]);

  console.log(`[METRICS] using ${vc.publicClient.chain.name}`);
  console.log(`[METRICS] compiling signups ${nameRegistryProxyConfig.address}`);
  const signups = new Map<string, number>();
  const { network } = vc.publicClient.chain;
  for (const log of nameReg.logs.sort(
    (a, b) => Number(a.blockNumber) - Number(b.blockNumber)
  )) {
    const ts = guessTimestampFromNum(log.blockNumber, network);
    addMetric(signups, ts, 1);
  }

  const tm = tokenMetadata;
  console.log(`[METRICS] compiling ${tm.symbol} transfers ${tm.address}`);
  const transfers = new Map<string, number>();
  coinIndexer.pipeAllTransfers(async (logs) => {
    for (const log of logs) {
      const from = nameReg.resolveDaimoNameForAddr(log.from);
      const to = nameReg.resolveDaimoNameForAddr(log.to);
      if (from == null && to == null) continue;
      const ts = guessTimestampFromNum(log.blockNumber!, network);
      addMetric(transfers, ts, 1);
    }
  });

  // Output CSV
  const csvLines = [["date", "signups", "transfers"].join(",")];
  const series = [signups, transfers];
  const dateSet = new Set(series.flatMap((s) => [...s.keys()]));
  const dates = [...dateSet].sort();
  for (const date of dates) {
    const values = series.map((s) => s.get(date) || 0);
    csvLines.push([date, ...values].join(","));
  }
  console.log(`\n${csvLines.join("\n")}\n`);
}

function addMetric(
  metrics: Map<string, number>,
  tsUnix: number,
  value: number
) {
  const week = getWeek(tsUnix * 1000);
  metrics.set(week, (metrics.get(week) || 0) + value);
}

// Returns eg 2023-09-24
function getWeek(tsMs: number): string {
  const date = new Date(tsMs);
  const sundayTs = tsMs - date.getUTCDay() * 24 * 60 * 60 * 1000;
  return new Date(sundayTs).toISOString().slice(0, 10);
}

function trpcDesc() {
  return `TRPC client scratchpad`;
}

async function trpc() {
  const apiUrl = process.env.DAIMO_APP_API_URL || "http://localhost:3000";
  console.log(`Connecting to TRPC at ${apiUrl}`);
  const trpc = createTRPCProxyClient<AppRouter>({
    links: [httpBatchLink({ url: apiUrl })],
  });

  console.log(`\n\nTRPC search`);
  const searchResults = await trpc.search.query({ prefix: "d" });
  console.log(JSON.stringify(searchResults));

  console.log(`\n\nTRPC resolveAddr`);
  const addr = "0xc60A0A0E8bBc32DAC2E03030989AD6BEe45A874D";
  const acc = await trpc.getEthereumAccount.query({ addr });
  console.log("Addr", addr);
  if (acc.name) console.log("Name", acc.name);
  if (acc.label) console.log("Label", acc.label);
  if (acc.ensName) console.log("ENS", acc.ensName);

  console.log(`\n\nTRPC getLinkStatus`);
  const status = await trpc.getLinkStatus.query({
    url: "http://localhost:3001/link/request/0x4aEC6307cc5E6Ac7A9a939125D3e2b58B38E6368/1.23",
  });
  console.log(JSON.stringify(status));
}

function mailingListDesc() {
  return `Format BCC line for the mailing list`;
}

// Given a CSV file, extracts the name and email column and formats it.
async function mailingList() {
  const csvPath = process.argv[3];
  if (!csvPath) throw new Error("Usage: mailing-list <csv path>");

  const json = await csv().fromFile(csvPath);

  console.log("RECIPIENTS");
  const recipients = json
    .filter((row) => row["Email"].includes("@"))
    .map((row) => {
      const name = row["Name"];
      const email = row["Email"];
      console.log(`${name} <${email}>`);
      return email;
    });
  console.log("");

  console.log(`BCC ONLY\n${recipients.join(", ")}\n\n`);
}
