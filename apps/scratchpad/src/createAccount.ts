import { getBundlerClientFromEnv } from "@daimo/api/src/network/bundlerClient";
import { ViemClient } from "@daimo/api/src/network/viemClient";
import { Telemetry } from "@daimo/api/src/server/telemetry";
import {
  PendingOpEvent,
  UserOpHex,
  assert,
  assertNotNull,
} from "@daimo/common";
import {
  daimoAccountABI,
  daimoAccountFactoryConfig,
  notesV1AddressMap,
  notesV2AddressMap,
} from "@daimo/contract";
import {
  DaimoOpSender,
  OpSenderCallback,
  SigningCallback,
} from "@daimo/userop";
import { p256 } from "@noble/curves/p256";
import { base64urlnopad } from "@scure/base";
import crypto from "node:crypto";
import {
  Hex,
  bytesToHex,
  concat,
  createPublicClient,
  createWalletClient,
  encodeAbiParameters,
  getAbiItem,
  hexToBytes,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { chainConfig } from "./env";

export function createAccountDesc() {
  return `Create a Daimo account. Fund with faucet. Send a test userop from that account.`;
}

export async function createAccount() {
  // Viem
  const chain = chainConfig.chainL2;
  const publicClient = createPublicClient({ chain, transport: http() });
  console.log(`Connected to ${chain.name} ${chain.id}`);

  const funderPrivKey = `0x${process.env.DAIMO_API_PRIVATE_KEY}` as const;
  const funderAccount = privateKeyToAccount(funderPrivKey);
  console.log(`Faucet account: ${funderAccount.address}`);
  const walletClient = createWalletClient({
    account: funderAccount,
    chain,
    transport: http(),
  });

  // Generate keypair
  // const p256 = { name: "ECDSA", namedCurve: "P-256", hash: "SHA-256" };
  const kH = "ce0a8faf51e77b5889d0cfb9b24075703fa60d1e643380bfa68b661551e7e3a8";
  const privKeyBytes = Buffer.from(kH, "hex");
  // const k = await crypto.subtle.importKey("raw", kB, p256, false, ["sign"]);
  const pubKeyRawHex = [
    "65a2fa44daad46eab0278703edb6c4dcf5e30b8a9aec09fdc71a56f52aa392e4",
    "4a7a9e4604aa36898209997288e902ac544a555e4b5e0a9efef2b59233f3f437",
  ].join("");

  // const key = await crypto.subtle.generateKey(p256, true, ["sign", "verify"]);
  // const pubKeyDer = await crypto.subtle.exportKey("spki", key.publicKey);
  // const pubKeyHex = Buffer.from(pubKeyDer).toString("hex");
  // console.log(`Generated pubkey: ${pubKeyHex}`);
  // const pubKeyRawHex = pubKeyHex.substring(56);

  // Daimo account
  const signer: SigningCallback = async (challenge: Hex) => {
    console.log(`Signing message: ${challenge}`);
    const bChallenge = hexToBytes(challenge);
    const challengeB64URL = base64urlnopad.encode(bChallenge);

    const clientDataJSON = JSON.stringify({
      type: "webauthn.get",
      challenge: challengeB64URL,
      origin: "daimo.com",
    });

    // const clientDataHash = new Uint8Array(
    //   await Crypto.digest(
    //     Crypto.CryptoDigestAlgorithm.SHA256,
    //     new TextEncoder().encode(clientDataJSON)
    //   )
    // );
    const clientDataHash = await crypto.subtle.digest(
      "SHA-256",
      Buffer.from(clientDataJSON)
    );

    const authenticatorData = new Uint8Array(37); // rpIdHash (32) + flags (1) + counter (4)
    authenticatorData[32] = 5; // flags: user present (1) + user verified (4)
    const message = concat([authenticatorData, new Uint8Array(clientDataHash)]);

    //const sigRaw = await crypto.subtle.sign(p256, k, Buffer.from(message));
    const sig = p256.sign(privKeyBytes, message);
    const sigRaw = sig.toCompactRawBytes();
    assert(sigRaw.length === 64, "Invalid signature length");

    // Extract R,S
    const r = Buffer.from(sigRaw).subarray(0, 32).toString("hex");
    const s = Buffer.from(sigRaw).subarray(32, 64).toString("hex");

    const challengeLocation = BigInt(clientDataJSON.indexOf('"challenge":'));
    const responseTypeLocation = BigInt(clientDataJSON.indexOf('"type":'));

    const signatureStruct = getAbiItem({
      abi: daimoAccountABI,
      name: "signatureStruct",
    }).inputs;

    const encodedSig = encodeAbiParameters(signatureStruct, [
      {
        authenticatorData: bytesToHex(authenticatorData),
        clientDataJSON,
        challengeLocation,
        responseTypeLocation,
        r: BigInt(`0x${r}`),
        s: BigInt(`0x${s}`),
      },
    ]);

    return {
      keySlot: 0,
      encodedSig,
    };
  };

  const bundlerClient = getBundlerClientFromEnv();
  const sender: OpSenderCallback = async (op: UserOpHex) => {
    const vc = new ViemClient(
      publicClient,
      publicClient,
      walletClient,
      new Telemetry()
    );
    const hash = await bundlerClient.getOpHash(op, vc.publicClient);
    console.log(`NOT sending userOp. Hash: ${hash}`);
    return { opHash: hash } as PendingOpEvent;
    // return bundlerClient.sendUserOp(op, vc);
  };

  const pubKey = Buffer.from(pubKeyRawHex, "hex");
  if (pubKey.length !== 64) {
    throw new Error("Invalid public key, wrong length");
  }

  const key1 = `0x${pubKey.subarray(0, 32).toString("hex")}` as Hex;
  const key2 = `0x${pubKey.subarray(32).toString("hex")}` as Hex;
  const salt = 0n;
  const args = [0, [key1, key2], [], salt] as const;

  const address = await publicClient.readContract({
    ...daimoAccountFactoryConfig,
    functionName: "getAddress",
    args,
  });
  console.log(`new account address ${address}`);

  // Deploy account
  const hash = await walletClient.writeContract({
    ...daimoAccountFactoryConfig,
    functionName: "createAccount",
    args,
    value: 0n,
  });
  console.log(`deploy transaction ${hash}`);
  const tx = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`deploy transaction status ${tx.status}`);

  const chainId = chainConfig.chainL2.id;
  const account = await DaimoOpSender.init({
    chainId,
    tokenAddress: chainConfig.tokenAddress,
    tokenDecimals: chainConfig.tokenDecimals,
    notesAddressV1: assertNotNull(notesV1AddressMap.get(chainId)),
    notesAddressV2: assertNotNull(notesV2AddressMap.get(chainId)),
    accountAddress: address,
    accountSigner: signer,
    opSender: sender,
    deadlineSecs: 60,
  });
  const addr = account.getAddress();
  console.log(`Burner Daimo account: ${addr}`);

  // // Fund it from the faucet
  // const usdcTxHash = await walletClient.writeContract({
  //   abi: erc20ABI,
  //   address: chainConfig.tokenAddress,
  //   functionName: "transfer",
  //   args: [addr, 1000000n],
  // });
  // console.log(`Faucet sent USDC to Daimo account: ${usdcTxHash}`);
  // await waitForTx(publicClient, usdcTxHash);

  // const depositTxHash = await walletClient.writeContract({
  //   address: getAddress(Constants.ERC4337.EntryPoint),
  //   abi: entryPointABI,
  //   functionName: "depositTo",
  //   args: [addr],
  //   value: 10n ** 16n, // 0.01 ETH
  // });
  // console.log(`Faucet deposited prefund: ${depositTxHash}`);
  // await waitForTx(publicClient, depositTxHash);

  // // Finally, we should be able to do a userop from our new Daimo account.
  // // Send $0.50 USDC to nibnalin.eth
  // const recipient = `0xF05b5f04B7a77Ca549C0dE06beaF257f40C66FDB`;
  // const nonce = new DaimoNonce(new DaimoNonceMetadata(DaimoNonceType.Send));
  // const userOpHash = await account.erc20transfer(recipient, "0.1", {
  //   nonce,
  //   chainGasConstants: {
  //     maxPriorityFeePerGas: "1000000",
  //     maxFeePerGas: "100000050",
  //     estimatedFee: 0.1,
  //     paymasterAddress: daimoPaymasterV2Address,
  //     preVerificationGas: "0",
  //   },
  // });
  // console.log("✅ userop accepted by bundler: ", userOpHash);
}

// async function waitForTx(
//   publicClient: PublicClient<Transport, Chain>,
//   hash: Hex
// ) {
//   const receipt = await publicClient.waitForTransactionReceipt({
//     hash,
//     timeout: 30000,
//   });
//   console.log(`...status: ${receipt.status}`);
// }
