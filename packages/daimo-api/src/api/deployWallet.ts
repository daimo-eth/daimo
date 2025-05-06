import {
  DaimoAccountCall,
  DaimoLinkStatus,
  TransferSwapClog,
  formatDaimoLink,
  getInviteStatus,
  retryBackoff,
} from "@daimo/common";
import { erc20Abi } from "@daimo/contract";
import { Address, Hex, encodeFunctionData } from "viem";

import { AccountFactory } from "../contract/accountFactory";
import { NameRegistry } from "../contract/nameRegistry";
import { Paymaster } from "../contract/paymaster";
import { IndexWatcher } from "../db/indexWatcher";
import { chainConfig } from "../env";
import { InviteCodeTracker } from "../offchain/inviteCodeTracker";
import { InviteGraph } from "../offchain/inviteGraph";
import { AntiSpam } from "../server/antiSpam";
import { Telemetry } from "../server/telemetry";
import { TrpcRequestContext } from "../server/trpc";

export async function deployWallet(
  ctx: TrpcRequestContext,
  name: string,
  pubKeyHex: Hex,
  inviteLinkStatus: DaimoLinkStatus,
  deviceAttestationString: Hex,
  watcher: IndexWatcher,
  nameReg: NameRegistry,
  accountFactory: AccountFactory,
  inviteCodeTracker: InviteCodeTracker,
  telemetry: Telemetry,
  paymaster: Paymaster,
  inviteGraph: InviteGraph
): Promise<{ address: Address; faucetTransfer?: TransferSwapClog }> {
  // For now, invite is required
  const inviteStatus = getInviteStatus(inviteLinkStatus);

  if (!inviteStatus.isValid) {
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
        abi: erc20Abi,
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
        abi: erc20Abi,
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
    () => accountFactory.deploy(pubKeyHex, initCalls)
  );

  const processed = await watcher.waitFor(Number(deployReceipt.blockNumber), 8);
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
  let faucetTransfer: TransferSwapClog | undefined;
  if (inviteLinkStatus.link.type === "invite") {
    const { requestInfo } = ctx;
    const isTestnet = chainConfig.chainL2.testnet;
    sendFaucet = isTestnet || (await AntiSpam.shouldSendFaucet(requestInfo));

    const inviteResult = await inviteCodeTracker.useInviteCode(
      address,
      deviceAttestationString,
      inviteLinkStatus.link.code,
      sendFaucet
    );

    if (inviteResult.faucetTransfer != null) {
      faucetTransfer = inviteResult.faucetTransfer;
    }
  }

  const explorer = chainConfig.chainL2.blockExplorers!.default.url;
  const inviteMeta = formatDaimoLink(inviteLinkStatus.link);
  const url = `${explorer}/address/${address}`;
  telemetry.recordClippy(
    `New user ${name} with invite code ${inviteMeta} at ${url}`,
    "celebrate"
  );

  return { address, faucetTransfer };
}
