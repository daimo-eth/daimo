import { DaimoAccountCall } from "@daimo/common";
import { daimoEphemeralNotesAddress, erc20ABI } from "@daimo/contract";
import { Address, Hex, encodeFunctionData } from "viem";

import { AccountFactory } from "../contract/accountFactory";
import { Faucet } from "../contract/faucet";
import { NameRegistry } from "../contract/nameRegistry";
import { chainConfig, retryBackoff } from "../env";
import { Telemetry } from "../telemetry";

export async function deployWallet(
  name: string,
  pubKeyHex: Hex,
  invCode: string | undefined,
  nameReg: NameRegistry,
  accountFactory: AccountFactory,
  faucet: Faucet,
  telemetry: Telemetry
): Promise<Address> {
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

  // If it worked, cache the name <> address mapping immediately.
  if (deployReceipt.status === "success") {
    nameReg.onSuccessfulRegister(name, address);

    if (invCode) {
      const dollars = chainConfig.chainL2.testnet ? 50 : 5;
      console.log(
        `[API] Request $${dollars} USDC from faucet for ${name} ${address}`
      );
      await retryBackoff(
        `faucet-${name}`,
        () => faucet.request(address, dollars, invCode),
        5
      );
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
