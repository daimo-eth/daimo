import { entryPointABI, erc20ABI, tokenMetadata } from "@daimo/contract";
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

export function createAccountDesc() {
  return `Create a Daimo account. Fund with faucet. Send a test userop from that account.`;
}

export async function createAccount() {
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
    const sigRaw = await crypto.subtle.sign(p256, key.privateKey, msgBuf);

    // DER encode
    const r = Buffer.from(sigRaw).subarray(0, 32);
    const s = Buffer.from(sigRaw).subarray(32, 64);

    function encodeInt(i: Buffer) {
      if (i.length !== 32) throw new Error();
      if (i[0] < 0x80) return Buffer.concat([Buffer.from([0x02, 32]), i]);
      return Buffer.concat([Buffer.from([0x02, 33, 0x00]), i]);
    }
    const encR = encodeInt(r);
    const encS = encodeInt(s);
    const header = Buffer.from([0x30, encR.length + encS.length]);
    const sigDer = Buffer.concat([header, encR, encS]);

    const sigHex = Buffer.from(sigDer).toString("hex");
    console.log(`Signature: ${sigHex}`);
    return sigHex;
  };
  const dryRun = false;
  const account = await DaimoAccount.init(
    publicClient,
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
    abi: erc20ABI,
    address: tokenMetadata.address,
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
  const userOp = await account.erc20transfer(recipient, "0.1");
  console.log("✅ userop accepted by bundler: ", userOp.userOpHash);

  const bundleTxHash = (await userOp.wait())?.transactionHash;
  if (!bundleTxHash) throw new Error("Bundle failed");
  console.log(`✅ bundle submitted: ${bundleTxHash}`);

  await waitForTx(publicClient, bundleTxHash as Hex);
  console.log(`✅ bundle confirmed: ${bundleTxHash}`);
}

async function waitForTx(publicClient: PublicClient, hash: Hex) {
  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
    timeout: 30000,
  });
  console.log(`...status: ${receipt.status}`);
}
