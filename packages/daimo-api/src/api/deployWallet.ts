import {
  DaimoLinkStatus,
  EAccount,
  TransferSwapClog,
  assert,
  assertNotNull,
  formatDaimoLink,
  getInviteStatus,
  retryBackoff,
} from "@daimo/common";
import { Hex } from "viem";

import { AccountFactory } from "../contract/accountFactory";
import { NameRegistry } from "../contract/nameRegistry";
import { Paymaster } from "../contract/paymaster";
import { chainConfig } from "../env";
import { InviteCodeTracker } from "../offchain/inviteCodeTracker";
import { InviteGraph } from "../offchain/inviteGraph";
import { AntiSpam } from "../server/antiSpam";
import { Telemetry } from "../server/telemetry";
import { TrpcRequestContext } from "../server/trpc";
import { Watcher } from "../shovel/watcher";

export async function deployWalletV2(
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
): Promise<{ eAcc: EAccount; faucetTransfer?: TransferSwapClog }> {
  // For now, invite is required
  const inviteStatus = getInviteStatus(inviteLinkStatus);

  if (!inviteStatus.isValid) {
    throw new Error("Invalid invite code");
  }

  // Whitelist the account for using our sponsoring paymaster
  paymaster.addToWhitelist(name);

  // TODO: put a check for the counterfactual address on client side so the server is not trusted.
  const address = await accountFactory.getAddress(pubKeyHex);
  console.log(`[API] Deploying account ${name} at ${address}`);
  const deployReceipt = await retryBackoff(
    `deployWallet-${name}-${pubKeyHex}`,
    () => accountFactory.deploy(pubKeyHex)
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

  const eAcc = assertNotNull(nameReg.getDaimoAccount(address));
  assert(eAcc.name === name);
  return { eAcc, faucetTransfer };
}

// TODO: approve on first use. Add approvedContracts to account sync.
// const initCalls: DaimoAccountCall[] = [
//   {
//     // Approve notes contract infinite spending on behalf of the account
//     dest: chainConfig.tokenAddress,
//     value: 0n,
//     data: encodeFunctionData({
//       abi: erc20ABI,
//       functionName: "approve",
//       args: [chainConfig.notesV2Address, maxUint256],
//     }),
//   },
//   {
//     // Approve paymaster contract infinite spending on behalf of the account
//     // While we no longer use the Pimlico paymaster, we approve it as a backup
//     // in case our own free paymaster is failing in future. This is a non-
//     // upgradeable, audited contract that lets you pay gas in stablecoins.
//     dest: chainConfig.tokenAddress,
//     value: 0n,
//     data: encodeFunctionData({
//       abi: erc20ABI,
//       functionName: "approve",
//       args: [chainConfig.pimlicoPaymasterAddress, maxUint256],
//     }),
//   },
//   nameReg.getRegisterNameCall(name), // Register name
// ];
