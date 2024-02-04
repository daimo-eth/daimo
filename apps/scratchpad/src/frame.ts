import {
  DaimoLink,
  formatDaimoLink,
  generateNoteSeedAddress,
  getNoteId,
} from "@daimo/common";
import {
  daimoEphemeralNotesV2ABI,
  daimoEphemeralNotesV2Address,
  erc20ABI,
  nameRegistryProxyConfig,
} from "@daimo/contract";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import {
  PrivateKeyAccount,
  createPublicClient,
  createWalletClient,
  http,
  maxUint256,
  parseUnits,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { chainConfig } from "./env";

export function createPaymentLinksDesc() {
  return "Create a bunch of payment links";
}

export function fetchFIDsDesc() {
  return "fetch farcaster users to allow";
}

const getWalletClient = (funderAccount: PrivateKeyAccount) => {
  const chain = chainConfig.chainL2;
  return createWalletClient({
    account: funderAccount,
    chain,
    transport: http(),
  });
};

async function approveNotes(funderAccount: PrivateKeyAccount) {
  const chain = chainConfig.chainL2;
  const walletClient = getWalletClient(funderAccount);
  const publicClient = createPublicClient({ chain, transport: http() });

  const { request } = await publicClient.simulateContract({
    account: funderAccount,
    address: chainConfig.tokenAddress,
    abi: erc20ABI,
    functionName: "approve",
    args: [daimoEphemeralNotesV2Address, maxUint256],
  });
  await walletClient.writeContract(request);
}

const ACCOUNT_DAIMO_NAME = "daimoo";
const DOLLARS = "3.5";

async function registerName(funderAccount: PrivateKeyAccount) {
  const chain = chainConfig.chainL2;
  const walletClient = getWalletClient(funderAccount);
  const publicClient = createPublicClient({ chain, transport: http() });

  const nameHex = Buffer.from(ACCOUNT_DAIMO_NAME.padEnd(32, "\0")).toString(
    "hex"
  );

  const { request } = await publicClient.simulateContract({
    account: funderAccount,
    address: nameRegistryProxyConfig.address,
    abi: nameRegistryProxyConfig.abi,
    functionName: "register",
    args: [`0x${nameHex}`, funderAccount.address],
  });
  await walletClient.writeContract(request);
}

async function createPaymentLink(
  funderAccount: PrivateKeyAccount,
  nonce: number
) {
  const chain = chainConfig.chainL2;
  const walletClient = getWalletClient(funderAccount);
  const publicClient = createPublicClient({ chain, transport: http() });

  const [noteSeed, noteAddress] = generateNoteSeedAddress();
  const noteId = getNoteId(noteAddress);

  const parsedAmount = parseUnits(DOLLARS, chainConfig.tokenDecimals);

  const { request } = await publicClient.simulateContract({
    account: funderAccount,
    address: daimoEphemeralNotesV2Address,
    abi: daimoEphemeralNotesV2ABI,
    functionName: "createNote",
    args: [noteAddress, parsedAmount],
    nonce,
  });
  await walletClient.writeContract(request);

  const link: DaimoLink = {
    type: "notev2",
    sender: ACCOUNT_DAIMO_NAME,
    dollars: `${DOLLARS}`,
    id: noteId,
    seed: noteSeed,
  };
  const url = formatDaimoLink(link);
  console.log(`${url}\n`);
}

export async function createPaymentLinks() {
  const funderPrivKey = `0x${process.env.DAIMOO_PRIVATE_KEY}` as const;
  const funderAccount = privateKeyToAccount(funderPrivKey);
  const chain = chainConfig.chainL2;
  const publicClient = createPublicClient({ chain, transport: http() });

  console.log(`Funder account: ${funderAccount.address}`);

  // await registerName(funderAccount);
  // await approveNotes(funderAccount);

  const txCount = await publicClient.getTransactionCount({
    address: funderAccount.address,
    blockTag: "pending",
  });

  let nonce = txCount;

  const promises = [];

  const count = parseInt(process.env.DAIMO_FRAME_LINK_COUNT!, 10);
  console.log(`Creating ${count} payment links\n`);

  for (let i = 0; i < count; i++) {
    promises.push(createPaymentLink(funderAccount, nonce));
    nonce++;
  }
  await Promise.all(promises);
}

export async function fetchFIDs() {
  const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY!);

  const fetchAllFollowing = async (fid: number) => {
    let cursor: string | null = "";
    let users: unknown[] = [];
    do {
      const result = await client.fetchUserFollowing(fid, {
        limit: 150,
        cursor,
      });
      users = users.concat(result.result.users);
      cursor = result.result.next.cursor;
      console.log(cursor);
    } while (cursor !== "" && cursor !== null);

    return users;
  };

  const dcFID = 56;
  const dcFollowings = await fetchAllFollowing(dcFID);
  console.log(dcFollowings);

  // write as JSON to file
  const fs = require("fs");
  fs.writeFileSync("dc-followings.json", JSON.stringify(dcFollowings, null, 2));
}
