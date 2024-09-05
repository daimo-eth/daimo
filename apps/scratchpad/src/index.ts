import { ProfileCache } from "@daimo/api/src/api/profile";
import { ClogMatcher } from "@daimo/api/src/contract/ClogMatcher";
import { ForeignCoinIndexer } from "@daimo/api/src/contract/foreignCoinIndexer";
import { HomeCoinIndexer } from "@daimo/api/src/contract/homeCoinIndexer";
import { NameRegistry } from "@daimo/api/src/contract/nameRegistry";
import { NoteIndexer } from "@daimo/api/src/contract/noteIndexer";
import { OpIndexer } from "@daimo/api/src/contract/opIndexer";
import { RequestIndexer } from "@daimo/api/src/contract/requestIndexer";
import { DB } from "@daimo/api/src/db/db";
import { StubExternalApiCache } from "@daimo/api/src/db/externalApiCache";
import { getViemClientFromEnv } from "@daimo/api/src/network/viemClient";
import { InviteGraph } from "@daimo/api/src/offchain/inviteGraph";
import { PaymentMemoTracker } from "@daimo/api/src/offchain/paymentMemoTracker";
import { Telemetry } from "@daimo/api/src/server/telemetry";
import { TokenRegistry } from "@daimo/api/src/server/tokenRegistry";
import { guessTimestampFromNum } from "@daimo/common";
import { daimoChainFromId, nameRegistryProxyConfig } from "@daimo/contract";
import csv from "csvtojson";
import { dnsEncode } from "ethers/lib/utils";

import { checkAccount, checkAccountDesc } from "./checkAccount";
import { chainConfig } from "./env";
import { getEacc, getEaccDesc } from "./getEacc";
import { getFids, getFidsDesc } from "./getFids";
import { pushNotify, pushNotifyDesc } from "./pushNotify";
import { testBinance, testBinanceDesc } from "./testBinance";

main()
  .then(() => console.log("Done"))
  .catch(console.error);

async function main() {
  const commands = [
    { name: "default", desc: defaultDesc(), fn: defaultScript },
    { name: "metrics", desc: metricsDesc(), fn: metrics },
    { name: "check", desc: checkAccountDesc(), fn: checkAccount },
    { name: "mailing-list", desc: mailingListDesc(), fn: mailingList },
    { name: "push-notify", desc: pushNotifyDesc(), fn: pushNotify },
    { name: "get-fids", desc: getFidsDesc(), fn: getFids },
    { name: "get-eaccount", desc: getEaccDesc(), fn: getEacc },
    { name: "test-binance", desc: testBinanceDesc(), fn: testBinance },
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

  let addr = "6152348912fb1e78c9037d83f9d4524d4a2988ed".toLowerCase();
  console.log(`addr ${addr} dnsEncode ` + dnsEncode(`${addr}.addr.reverse`));

  addr = "179A862703a4adfb29896552DF9e307980D19285".toLowerCase();
  console.log(`addr ${addr} dnsEncode ` + dnsEncode(`${addr}.addr.reverse`));

  addr = "179A862703a4adfb29896552DF9e307980D19286".toLowerCase();
  console.log(`addr ${addr} dnsEncode ` + dnsEncode(`${addr}.addr.reverse`));
}

function metricsDesc() {
  return `Print weekly Daimo usage metrics`;
}

async function metrics() {
  const vc = getViemClientFromEnv(new Telemetry(), new StubExternalApiCache());

  console.log(`[METRICS] using wallet ${vc.account.address}`);
  const db = new DB();
  const inviteGraph = new InviteGraph(db);
  const profileCache = new ProfileCache(vc, db);
  const nameReg = new NameRegistry(vc, inviteGraph, profileCache, new Set([]));
  const paymentMemoTracker = new PaymentMemoTracker(db);
  const tokenReg = new TokenRegistry();

  const clogMatcher = new ClogMatcher(tokenReg);
  const opIndexer = new OpIndexer(clogMatcher);
  const noteIndexer = new NoteIndexer(nameReg, opIndexer, paymentMemoTracker);
  const requestIndexer = new RequestIndexer(db, nameReg, paymentMemoTracker);
  const foreignCoinIndexer = new ForeignCoinIndexer(nameReg, vc, tokenReg);
  const coinIndexer = new HomeCoinIndexer(
    vc,
    opIndexer,
    noteIndexer,
    requestIndexer,
    foreignCoinIndexer,
    paymentMemoTracker,
    clogMatcher
  );

  console.log(`[METRICS] using ${vc.publicClient.chain.name}`);
  console.log(`[METRICS] compiling signups ${nameRegistryProxyConfig.address}`);
  const signups = new Map<string, number>();
  const daimoChain = daimoChainFromId(vc.publicClient.chain.id);
  for (const log of nameReg.logs.sort((a, b) => a.timestamp - b.timestamp)) {
    addMetric(signups, log.timestamp, 1);
  }

  const { tokenSymbol, tokenAddress } = chainConfig;
  console.log(`[METRICS] compiling ${tokenSymbol} transfers ${tokenAddress}`);
  const transfers = new Map<string, number>();
  coinIndexer.pipeAllTransfers(async (logs) => {
    for (const log of logs) {
      const from = nameReg.resolveDaimoNameForAddr(log.from);
      const to = nameReg.resolveDaimoNameForAddr(log.to);
      if (from == null && to == null) continue;
      const ts = guessTimestampFromNum(log.blockNumber!, daimoChain);
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
