// https://api.pimlico.io/v1/goerli/rpc?apikey=70ecef54-a28e-4e96-b2d3-3ad67fbc1b07

import {
  entryPointABI,
  testUsdcAddress,
  testUsdcConfig,
} from "@daimo/contract";
import { DaimoAccount, SigningCallback } from "@daimo/userop";
import crypto from "node:crypto";
import { Constants } from "userop";
import {
  Hex,
  PublicClient,
  createPublicClient,
  createWalletClient,
  getAddress,
  getContract,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseGoerli } from "viem/chains";

async function main() {
  // TODO: try paymaster once it supports Base Goerli.
  //
  // Pimlico paymaster, uses ethers
  //   const provider = new StaticJsonRpcProvider("https://goerli.base.org");
  //   const erc20Paymaster = await getERC20Paymaster(provider, "USDC");
  //   const paymasterAddr = erc20Paymaster.contract.address as Address;
  //   console.log(`Pimlico paymaster: ${paymasterAddr}`);

  // Viem
  const chain = baseGoerli;
  const publicClient = createPublicClient({ chain, transport: http() });
  console.log(`Connected to ${chain.name}, ${publicClient.transport.url}`);

  // Generate keypair
  const p256 = { name: "ECDSA", namedCurve: "P-256", hash: "SHA-256" };
  const key = await crypto.subtle.generateKey(p256, true, ["sign", "verify"]);
  const pubKeyDer = await crypto.subtle.exportKey("spki", key.publicKey);
  const pubKeyHex = Buffer.from(pubKeyDer).toString("hex");
  console.log(`Generated pubkey: ${pubKeyHex}`);

  // Daimo account
  const signer: SigningCallback = async (msg: string) => {
    console.log(`Signing message: ${msg}`);
    const msgBuf = Buffer.from(msg, "hex");
    const sig = await crypto.subtle.sign(p256, key.privateKey, msgBuf);
    const sigHex = Buffer.from(sig).toString("hex");
    console.log(`Signature: ${sigHex}`);
    return sigHex;
  };
  const dryRun = false;
  const account = await DaimoAccount.init(
    publicClient,
    testUsdcAddress,
    pubKeyHex,
    signer,
    dryRun
  );
  const addr = account.getAddress();
  console.log(`Burner Daimo account: ${addr}`);

  // Fund it from the faucet
  const faucetPrivKey = `0x${process.env.DAIMO_API_PRIVATE_KEY}` as const;
  const faucetAccount = privateKeyToAccount(faucetPrivKey);
  console.log(`Faucet account: ${faucetAccount.address}`);
  const walletClient = createWalletClient({
    account: faucetAccount,
    chain,
    transport: http(),
  });
  const testUSDC = getContract({
    ...testUsdcConfig,
    publicClient,
    walletClient,
  });
  const usdcTxHash = await testUSDC.write.transfer([addr, 1000000n]);
  console.log(`Faucet sent USDC to Daimo account: ${usdcTxHash}`);
  await waitForTx(publicClient, usdcTxHash);

  // Get the entrypoint contract
  const entrypoint = getContract({
    address: getAddress(Constants.ERC4337.EntryPoint),
    abi: entryPointABI,
    publicClient,
    walletClient,
  });
  const depositTxHash = await entrypoint.write.depositTo([addr], {
    value: 10n ** 16n, // 0.01 ETH
  });
  console.log(`Faucet deposited prefund: ${depositTxHash}`);
  await waitForTx(publicClient, depositTxHash);

  // Finally, we should be able to do a userop from our new Daimo account.
  // Send $0.50 USDC to nibnalin.eth
  const recipient = `0xF05b5f04B7a77Ca549C0dE06beaF257f40C66FDB`;
  const opHashApprove = await account.erc20transfer(recipient, "500000");
  console.log(`Approve userop: ${opHashApprove}`);
}

async function waitForTx(publicClient: PublicClient, hash: Hex) {
  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
    pollingInterval: 1000,
    timeout: 60000,
  });
  console.log(`...status: ${receipt.status}`);
}

main()
  .then(() => console.log("Done"))
  .catch(console.error);
