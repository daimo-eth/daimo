// https://api.pimlico.io/v1/goerli/rpc?apikey=70ecef54-a28e-4e96-b2d3-3ad67fbc1b07

import { AppRouter } from "@daimo/api";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import csv from "csvtojson";
import { createPublicClient, numberToHex, webSocket } from "viem";
import { baseGoerli } from "viem/chains";

import { checkAccount, checkAccountDesc } from "./checkAccount";
import { createAccount, createAccountDesc } from "./createAccount";
import { pushNotify, pushNotifyDesc } from "./pushNotify";

main()
  .then(() => console.log("Done"))
  .catch(console.error);

async function main() {
  const commands = [
    { name: "ts", desc: tsDesc(), fn: ts },
    { name: "trpc", desc: trpcDesc(), fn: trpc },
    { name: "create", desc: createAccountDesc(), fn: createAccount },
    { name: "check", desc: checkAccountDesc(), fn: checkAccount },
    { name: "mailing-list", desc: mailingListDesc(), fn: mailingList },
    { name: "push-notify", desc: pushNotifyDesc(), fn: pushNotify },
  ];

  const cmdName = process.argv[2];
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

function tsDesc() {
  return `Typescript scratchpad`;
}

async function ts() {
  console.log("Hello, world");

  const num =
    23658957077183673623975163142370986705703709099221578179586031616n;
  console.log(`Hex length: ` + num.toString(16).length);
  console.log(`toHex() length: ` + numberToHex(num).length);
  console.log(`toHex(64) length: ` + numberToHex(num, { size: 64 }).length);
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
