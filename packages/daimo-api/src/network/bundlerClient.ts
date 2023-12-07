import {
  bundleBulkerABI,
  bundleBulkerAddress,
  daimoTransferInflatorABI,
} from "@daimo/bulk";
import { UserOpHex, assert } from "@daimo/common";
import { daimoPaymasterAddress } from "@daimo/contract";
import { BundlerJsonRpcProvider, Constants } from "userop";
import {
  Account,
  Address,
  Chain,
  Hex,
  PublicClient,
  Transport,
  WalletClient,
  concatHex,
  hexToBigInt,
  isHex,
  stringToHex,
  toHex,
} from "viem";

import { ViemClient } from "./viemClient";

interface GasEstimate {
  preVerificationGas: Hex;
}

interface GasPriceParams {
  maxFeePerGas: Hex;
  maxPriorityFeePerGas: Hex;
}

interface GasPrice {
  slow: GasPriceParams;
  standard: GasPriceParams;
  fast: GasPriceParams;
}

/** Sends userops through an ERC-4337 bundler. */
export class BundlerClient {
  provider: BundlerJsonRpcProvider;

  // Compression settings
  private inflatorAddr: Address = "0x531033e5eA309EF20771a7313991fC732A28a844";
  private inflatorID: number | undefined;
  private inflatorCoinAddr: Address | undefined;

  constructor(bundlerRpcUrl: string, private vc?: ViemClient) {
    this.provider = new BundlerJsonRpcProvider(bundlerRpcUrl);
  }

  async init(publicClient: PublicClient) {
    console.log(`[BUNDLER] init, loading compression info`);
    this.inflatorID = await publicClient.readContract({
      abi: bundleBulkerABI,
      address: bundleBulkerAddress,
      functionName: "inflatorToID",
      args: [this.inflatorAddr],
    });
    this.inflatorCoinAddr = await publicClient.readContract({
      abi: daimoTransferInflatorABI,
      address: this.inflatorAddr,
      functionName: "coinAddr",
    });
    console.log(`[BUNDLER] init done. inflatorID: ${this.inflatorID}`);
  }

  async sendUserOp(
    op: UserOpHex,
    walletClient: WalletClient<Transport, Chain, Account>
  ) {
    console.log(`[BUNDLER] submtting userOp: ${JSON.stringify(op)}`);

    // TEST: compress the op, send via Bulk
    try {
      const compressed = this.compress(op);
      return this.sendCompressedOpToBulk(compressed, walletClient);
    } catch (e) {
      console.log(`[BUNDLER] cant send compressed, falling back: ${e}`);
      return this.sendUserOpToProvider(op);
    }
  }

  compress(op: UserOpHex) {
    if (this.inflatorID == null || this.inflatorCoinAddr == null) {
      throw new Error("cant compress, missing inflator info");
    }

    const ret: Hex[] = [];

    // sender
    ret.push(op.sender);

    // nonce
    let m = /^0x0{16}(................................)0{16}$/i.exec(op.nonce);
    if (!m) throw new Error("cant compress, bad nonce: " + op.nonce);
    ret.push(`0x${m[1]}`);

    // gas
    ret.push(toHex(hexToBigInt(op.preVerificationGas), { size: 4 }));
    ret.push(toHex(hexToBigInt(op.maxFeePerGas), { size: 6 }));
    ret.push(toHex(hexToBigInt(op.maxPriorityFeePerGas), { size: 6 }));

    // callData: ERC20 transfer
    const calldataRegex = new RegExp(
      [
        "^",
        "0x34fcd5be", // executeBatch
        "0000000000000000000000000000000000000000000000000000000000000020",
        "0000000000000000000000000000000000000000000000000000000000000001",
        "0000000000000000000000000000000000000000000000000000000000000020",
        "000000000000000000000000" + this.inflatorCoinAddr.slice(2),
        "0000000000000000000000000000000000000000000000000000000000000000",
        "0000000000000000000000000000000000000000000000000000000000000060",
        "0000000000000000000000000000000000000000000000000000000000000044",
        "a9059cbb", // transfer
        "000000000000000000000000(.{40})",
        "0000000000000000000000000000000000000000000000000000(.{12})",
        "00000000000000000000000000000000000000000000000000000000",
        "$",
      ].join(),
      "i"
    );
    m = calldataRegex.exec(op.callData);
    if (!m) throw new Error("cant compress, bad callData: " + op.callData);
    ret.push(`0x${m[1]}`); // to
    ret.push(`0x${m[2]}`); // amount

    // paymaster signature
    const paymasterRegex = new RegExp(`${daimoPaymasterAddress}(.{130})$`, "i");
    m = paymasterRegex.exec(op.paymasterAndData);
    if (!m) throw new Error("cant compress, bad paym.:" + op.paymasterAndData);
    ret.push(`0x${m[1]}`); // paymaster sig r,s,v

    // op signature
    const sigRegex = new RegExp(
      [
        "^",
        "0x(.{16})", // sig version, validUntil, keySlot
        "0000000000000000000000000000000000000000000000000000000000000020",
        "00000000000000000000000000000000000000000000000000000000000000c0",
        "0000000000000000000000000000000000000000000000000000000000000120",
        "0000000000000000000000000000000000000000000000000000000000000017",
        "0000000000000000000000000000000000000000000000000000000000000001",
        "(.{64})", // sig r
        "(.{64})", // sig s
        "0000000000000000000000000000000000000000000000000000000000000025",
        "0000000000000000000000000000000000000000000000000000000000000000",
        "0500000000000000000000000000000000000000000000000000000000000000",
        "000000000000000000000000000000000000000000000000000000000000005a",
        stringToHex('{"type":"webauthn.get","challenge":"').slice(2),
        "(.{104})", // authenticator challenge
        '"}',
        "000000000000",
        "$",
      ].join(),
      "i"
    );
    m = sigRegex.exec(op.signature);
    if (!m) throw new Error("cant compress, bad signature: " + op.signature);
    ret.push(`0x${m[1]}`); // sig version, validUntil, keySlot
    ret.push(`0x${m[2]}`); // sig r
    ret.push(`0x${m[3]}`); // sig s
    ret.push(`0x${m[4]}`); // authenticator challenge

    return concatHex(ret);
  }

  async sendCompressedOpToBulk(
    compressed: Hex,
    walletClient: WalletClient<Transport, Chain, Account>
  ) {
    const txHash = await walletClient.writeContract({
      abi: bundleBulkerABI,
      address: bundleBulkerAddress,
      functionName: "submit",
      args: [compressed],
    });
    return txHash;
  }

  async sendUserOpToProvider(op: UserOpHex) {
    const args = [op, Constants.ERC4337.EntryPoint];
    const opHash = await this.provider.send("eth_sendUserOperation", args);
    assert(isHex(opHash));
    console.log(`[BUNDLER] submitted userOpHash: ${opHash}`);
    return opHash;
  }

  async estimatePreVerificationGas(op: UserOpHex) {
    const args = [op, Constants.ERC4337.EntryPoint];
    const gasEstimate = (await this.provider.send(
      "eth_estimateUserOperationGas",
      args
    )) as GasEstimate;
    console.log(
      `[BUNDLER] estimated userOp gas: ${JSON.stringify(op)}: ${JSON.stringify(
        gasEstimate
      )}`
    );
    assert(isHex(gasEstimate.preVerificationGas));
    return hexToBigInt(gasEstimate.preVerificationGas);
  }

  async getUserOperationGasPriceParams() {
    console.log(`[BUNDLER] fetching gas price params`);
    const gasPrice = (await this.provider.send(
      "pimlico_getUserOperationGasPrice",
      []
    )) as GasPrice;
    console.log(
      `[BUNDLER] fetched gas price params: ${JSON.stringify(gasPrice)}`
    );
    return gasPrice.fast;
  }
}

/** Requires DAIMO_BUNDLER_RPC_URL. */
export function getBundlerClientFromEnv(vc?: ViemClient) {
  const rpcUrl = process.env.DAIMO_BUNDLER_RPC || "";
  assert(rpcUrl !== "", "DAIMO_BUNDLER_RPC env var missing");
  return new BundlerClient(rpcUrl, vc);
}
