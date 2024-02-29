import {
  DaimoAccountCall,
  DaimoLinkStatus,
  formatDaimoLink,
  getInviteStatus,
} from "@daimo/common";
import { erc20ABI } from "@daimo/contract";
import { Address, Hex, encodeFunctionData } from "viem";

import { AccountFactory } from "../contract/accountFactory";
import { NameRegistry } from "../contract/nameRegistry";
import { Paymaster } from "../contract/paymaster";
import { chainConfig } from "../env";
import { InviteCodeTracker } from "../offchain/inviteCodeTracker";
import { InviteGraph } from "../offchain/inviteGraph";
import { Telemetry } from "../server/telemetry";
import { TrpcRequestContext } from "../server/trpc";
import { Watcher } from "../shovel/watcher";
import { retryBackoff } from "../utils/retryBackoff";

export async function deployWallet(
  ctx: TrpcRequestContext,
  name: string,
  pubKeyHex: Hex,
  inviteLinkStatus: DaimoLinkStatus,
  deviceAttestationString: Hex,
  watcher: Watcher,
  nameReg: NameRegistry,
  accountFactory: AccountFactory,
  inviteCodeTracker: InviteCodeTracker,
  telemetry: Telemetry,
  paymaster: Paymaster,
  inviteGraph: InviteGraph
): Promise<Address> {
  // For now, invite is required
  const invSuccess = getInviteStatus(inviteLinkStatus).isValid;

  if (!invSuccess) {
    throw new Error("Invalid invite code");
  }

  // Whitelist the account for using our sponsoring paymaster
  paymaster.addToWhitelist(name);

  const maxUint256 = 2n ** 256n - 1n;
  const initCalls: DaimoAccountCall[] = [
    {
      // Approve notes contract infinite spending on behalf of the account
      dest: chainConfig.tokenAddress,
      value: 0n,
      data: encodeFunctionData({
        abi: erc20ABI,
        functionName: "approve",
        args: [chainConfig.notesV2Address, maxUint256],
      }),
    },
    {
      // Approve paymaster contract infinite spending on behalf of the account
      // While we no longer use the Pimlico paymaster, we approve it as a backup
      // in case our own free paymaster is failing in future.
      dest: chainConfig.tokenAddress,
      value: 0n,
      data: encodeFunctionData({
        abi: erc20ABI,
        functionName: "approve",
        args: [chainConfig.pimlicoPaymasterAddress, maxUint256],
      }),
    },
    nameReg.getRegisterNameCall(name), // Register name
  ];
  const approvals = `Approving ${chainConfig.notesV2Address} and ${chainConfig.pimlicoPaymasterAddress}`;

  // TODO: put a check for the counterfactual address on client side so the server is not trusted.
  const address = await accountFactory.getAddress(pubKeyHex, initCalls);
  console.log(`[API] Deploying account ${name} at ${address}. ${approvals}`);
  const deployReceipt = await retryBackoff(
    `deployWallet-${name}-${pubKeyHex}`,
    () => accountFactory.deploy(pubKeyHex, initCalls),
    5
  );

  const processed = await watcher.waitFor(deployReceipt.blockNumber, 8);
  if (!processed) {
    console.log(
      `[API] Deploy tx ${deployReceipt.transactionHash} not processed`
    );
  }

  if (deployReceipt.status !== "success") {
    throw new Error(`Couldn't create ${name}: ${deployReceipt.status}`);
  }

  // If it worked, process and cache the account metadata in the background.
  nameReg.onSuccessfulRegister(name, address);
  inviteGraph.processDeployWallet(address, inviteLinkStatus);

  // Send starter USDC only for invite links, and check for spam.
  let sendFaucet = false;
  if (inviteLinkStatus.link.type === "invite") {
    const { requestInfo } = ctx;
    sendFaucet = await queryFaucetAntiSpamApi(requestInfo);

    inviteCodeTracker.useInviteCode(
      address,
      deviceAttestationString,
      inviteLinkStatus.link.code,
      sendFaucet
    );
  }

  const explorer = chainConfig.chainL2.blockExplorers!.default.url;
  const inviteMeta = formatDaimoLink(inviteLinkStatus.link);
  const url = `${explorer}/address/${address}`;
  telemetry.recordClippy(
    `New user ${name} with invite code ${inviteMeta} at ${url}`,
    "celebrate"
  );

  return address;
}

async function queryFaucetAntiSpamApi(reqInfo: RequestInfo): Promise<boolean> {
  const faucetApiUrl = process.env.DAIMO_FAUCET_API_URL || "";
  if (faucetApiUrl === "") return false;

  let sendFaucet = false;
  try {
    const faucetRes = await fetch(faucetApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.DAIMO_FAUCET_API_KEY || "",
      },
      body: JSON.stringify(reqInfo),
    });
    const faucetJson = await faucetRes.json();
    sendFaucet = !!faucetJson.sendFaucet;
    console.log(`[API] queried ${faucetApiUrl}, got ${sendFaucet}`, reqInfo);
  } catch (e: any) {
    console.error(`[API] error querying faucet API`, faucetApiUrl, e);
  }
  return sendFaucet;
}
