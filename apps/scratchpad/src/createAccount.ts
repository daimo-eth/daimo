import {
  accountFactoryConfig,
  entryPointABI,
  erc20ABI,
  tokenMetadata,
} from "@daimo/contract";
import {
  DaimoNonce,
  DaimoNonceMetadata,
  DaimoNonceType,
  DaimoOpSender,
  SigningCallback,
} from "@daimo/userop";
import crypto from "node:crypto";
import { Constants } from "userop";
import {
  Hex,
  PublicClient,
  Transport,
  createPublicClient,
  createWalletClient,
  getAddress,
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

    // Valid forever
    const validUntil = 0;

    return { derSig: sigHex, keySlot: 0, validUntil };
  };
  const dryRun = false;

  const pubKey = Buffer.from(pubKeyHex.substring(56), "hex");
  if (pubKey.length !== 64) {
    throw new Error("Invalid public key, wrong length");
  }

  const key1 = `0x${pubKey.subarray(0, 32).toString("hex")}` as Hex;
  const key2 = `0x${pubKey.subarray(32).toString("hex")}` as Hex;
  const salt = 0n;
  const args = [0, [key1, key2], [], salt] as const;

  const address = await publicClient.readContract({
    ...accountFactoryConfig,
    functionName: "getAddress",
    args,
  });

  const funderPrivKey = `0x${process.env.DAIMO_API_PRIVATE_KEY}` as const;
  const funderAccount = privateKeyToAccount(funderPrivKey);
  console.log(`Faucet account: ${funderAccount.address}`);
  const walletClient = createWalletClient({
    account: funderAccount,
    chain,
    transport: http(),
  });

  // Deploy account
  const hash = await walletClient.writeContract({
    ...accountFactoryConfig,
    functionName: "createAccount",
    args,
    value: 0n,
  });
  console.log(`[API] deploy transaction ${hash}`);
  const tx = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`[API] deploy transaction ${tx.status}`);

  const account = await DaimoOpSender.init(
    address,
    signer,
    chain.rpcUrls.public.http[0],
    dryRun
  );
  const addr = account.getAddress();
  console.log(`Burner Daimo account: ${addr}`);

  // Fund it from the faucet
  const usdcTxHash = await walletClient.writeContract({
    abi: erc20ABI,
    address: tokenMetadata.address,
    functionName: "transfer",
    args: [addr, 1000000n],
  });
  console.log(`Faucet sent USDC to Daimo account: ${usdcTxHash}`);
  await waitForTx(publicClient, usdcTxHash);

  const depositTxHash = await walletClient.writeContract({
    address: getAddress(Constants.ERC4337.EntryPoint),
    abi: entryPointABI,
    functionName: "depositTo",
    args: [addr],
    value: 10n ** 16n, // 0.01 ETH
  });
  console.log(`Faucet deposited prefund: ${depositTxHash}`);
  await waitForTx(publicClient, depositTxHash);

  // Finally, we should be able to do a userop from our new Daimo account.
  // Send $0.50 USDC to nibnalin.eth
  const recipient = `0xF05b5f04B7a77Ca549C0dE06beaF257f40C66FDB`;
  const nonce = new DaimoNonce(new DaimoNonceMetadata(DaimoNonceType.Send));
  const userOp = await account.erc20transfer(recipient, "0.1", {
    nonce,
    chainGasConstants: {
      // TODO: works for now but we should properly query this rather than hardcode
      paymasterAndData:
        "0x13f490FafBb206440F25760A10C21A6220017fFa0000000000000000000000000000000000000000000000000000000000129aa2",
      maxPriorityFeePerGas: "1000000",
      maxFeePerGas: "100000050",
    },
  });
  console.log("✅ userop accepted by bundler: ", userOp.userOpHash);

  const bundleTxHash = (await userOp.wait())?.transactionHash;
  if (!bundleTxHash) throw new Error("Bundle failed");
  console.log(`✅ bundle submitted: ${bundleTxHash}`);

  await waitForTx(publicClient, bundleTxHash as Hex);
  console.log(`✅ bundle confirmed: ${bundleTxHash}`);
}

async function waitForTx(
  publicClient: PublicClient<Transport, typeof baseGoerli>,
  hash: Hex
) {
  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
    timeout: 30000,
  });
  console.log(`...status: ${receipt.status}`);
}
