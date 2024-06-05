import { assertNotNull } from "@daimo/common";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import csv from "csvtojson";
import _ from "lodash";
import { Address, getAddress } from "viem";

export function getFidsDesc() {
  return `Get FIDs owning a token`;
}

export async function getFids() {
  const csvPath = process.argv[3];
  if (!csvPath) {
    console.error("Usage: get-fids <file of eth addrs, eg from holders.at>");
    process.exit(1);
  }

  const json = await csv({ headers: ["address"] }).fromFile(csvPath);
  const ethAddrs = json.map((row) => getAddress(row.address));
  console.log(`Loaded ${ethAddrs.length} addresses from ${csvPath}`);

  const fids = await getFidsForAddrs(ethAddrs);
  console.log(`Loaded ${fids.length} FIDs`);
  console.log("");
  console.log(fids.join(", "));
}

async function getFidsForAddrs(addrs: Address[]): Promise<number[]> {
  const client = new NeynarAPIClient(
    assertNotNull(process.env.DAIMO_NEYNAR_KEY)
  );
  const fids = [] as number[];
  for (const chunk of _.chunk(addrs, 300)) {
    console.log(`Fetching FIDs for ${chunk.length} addrs`);
    const users = await client.fetchBulkUsersByEthereumAddress(chunk);
    for (const us of Object.values(users)) {
      fids.push(...us.map((u) => Number(u.fid)));
    }
  }
  return fids.sort((a, b) => a - b);
}
