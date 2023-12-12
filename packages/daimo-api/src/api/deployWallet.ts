import { DaimoAccountCall } from "@daimo/common";
import { daimoEphemeralNotesAddress, erc20ABI } from "@daimo/contract";
import { Address, Hex, encodeFunctionData } from "viem";

import { AccountFactory } from "../contract/accountFactory";
import { Faucet } from "../contract/faucet";
import { NameRegistry } from "../contract/nameRegistry";
import { Paymaster } from "../contract/paymaster";
import { chainConfig } from "../env";
import { Telemetry } from "../server/telemetry";
import { Watcher } from "../shovel/watcher";
import { retryBackoff } from "../utils/retryBackoff";

export async function deployWallet(
  name: string,
  pubKeyHex: Hex,
  invCode: string | undefined,
  watcher: Watcher,
  nameReg: NameRegistry,
  accountFactory: AccountFactory,
  faucet: Faucet,
  telemetry: Telemetry,
  paymaster: Paymaster
): Promise<Address> {
  // For now, invite code is required
  const invCodeSuccess = invCode && (await faucet.useInviteCode(invCode));
  if (!invCodeSuccess) {
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
        args: [daimoEphemeralNotesAddress, maxUint256],
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

  // TODO: put a check for the counterfactual address on client side so the server is not trusted.
  const address = await accountFactory.getAddress(pubKeyHex, initCalls);

  console.log(`[API] Deploying account for ${name}, address ${address}`);
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

  // If it worked, cache the name <> address mapping immediately.
  if (deployReceipt.status === "success") {
    nameReg.onSuccessfulRegister(name, address);

    if (invCode && chainConfig.chainL2.testnet) {
      const dollars = 50;
      console.log(`[API] faucet req: $${dollars} USDC for ${name} ${address}`);
      faucet.request(address, dollars); // Kick off in background
    }
  } else {
    throw new Error(`Couldn't create ${name}: ${deployReceipt.status}`);
  }

  const explorer = chainConfig.chainL2.blockExplorers!.default.url;
  const url = `${explorer}/address/${address}`;
  telemetry.recordClippy(
    `New user ${name} with invite code ${invCode} at ${url}`,
    "celebrate"
  );

  return address;
}
