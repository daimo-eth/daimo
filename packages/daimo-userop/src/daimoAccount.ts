import { DaimoAccountCall, now } from "@daimo/common";
import { daimoAccountABI } from "@daimo/contract";
import {
  ENTRYPOINT_ADDRESS_V06,
  getAccountNonce,
  getUserOperationHash,
} from "permissionless";
import {
  SignTransactionNotSupportedBySmartAccount,
  SmartAccount,
  toSmartAccount,
} from "permissionless/accounts";
import { ENTRYPOINT_ADDRESS_V06_TYPE, Prettify } from "permissionless/types";
import { isSmartAccountDeployed } from "permissionless/utils";
import {
  type Address,
  type Chain,
  type Client,
  type Hex,
  type Transport,
  encodeFunctionData,
  concat,
  hexToBytes,
  numberToBytes,
  bytesToHex,
} from "viem";
import { getChainId } from "viem/actions";

import { SigningCallback } from "./callback";

export type DaimoSmartAccount<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined
> = SmartAccount<
  ENTRYPOINT_ADDRESS_V06_TYPE,
  "DaimoSmartAccount",
  transport,
  chain
>;

export type SignerToDaimoSmartAccountParameters<
  TAddress extends Address = Address
> = Prettify<{
  address: TAddress;
  signer: SigningCallback;
  /** Deadline to calculate validUntil before sending each operation */
  deadlineSecs: number;
}>;

/**
 * @description Creates an Daimo Account from a signer function.
 *
 * @returns Daimo Account
 */
export async function signerToDaimoSmartAccount<
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined,
  TAddress extends Address = Address
>(
  client: Client<TTransport, TChain, undefined>,
  {
    address,
    signer,
    deadlineSecs,
  }: SignerToDaimoSmartAccountParameters<TAddress>
): Promise<DaimoSmartAccount<TTransport, TChain>> {
  const chainId = await (client.chain?.id ?? getChainId(client));

  if (!address) throw new Error("Account address not found");

  let smartAccountDeployed = await isSmartAccountDeployed(client, address);

  return toSmartAccount({
    address,
    signMessage: async (_: any) => {
      throw new Error("Daimo account isn't 1271 compliant");
    },
    signTransaction: (_: any, __: any) => {
      throw new SignTransactionNotSupportedBySmartAccount();
    },
    signTypedData: async (_: any) => {
      throw new Error("Daimo account isn't 1271 compliant");
    },
    client,
    publicKey: address,
    entryPoint: ENTRYPOINT_ADDRESS_V06,
    source: "DaimoSmartAccount",
    async getNonce() {
      return getAccountNonce(client, {
        sender: address,
        entryPoint: ENTRYPOINT_ADDRESS_V06,
      });
    },
    async signUserOperation(userOperation: any) {
      const hexOpHash = getUserOperationHash({
        userOperation,
        entryPoint: ENTRYPOINT_ADDRESS_V06,
        chainId,
      });

      const bVersion = numberToBytes(1, { size: 1 });

      const validUntil = now() + deadlineSecs;
      const bValidUntil = numberToBytes(validUntil, { size: 6 });

      const bOpHash = hexToBytes(hexOpHash);
      const bMsg = concat([bVersion, bValidUntil, bOpHash]);

      const { keySlot, encodedSig } = await signer(bytesToHex(bMsg));

      const bKeySlot = numberToBytes(keySlot, { size: 1 });

      const sig = concat([
        bVersion,
        bValidUntil,
        bKeySlot,
        hexToBytes(encodedSig),
      ]);

      return `0x${Buffer.from(sig).toString("hex")}` as Hex;
    },
    async getInitCode() {
      if (smartAccountDeployed) return "0x";

      smartAccountDeployed = await isSmartAccountDeployed(client, address);

      if (smartAccountDeployed) return "0x";

      return "0x";

      // return concatHex([
      //     factoryAddress,
      //     await getAccountInitCode(viemSigner.address, index)
      // ])
    },
    async getFactory() {
      if (smartAccountDeployed) return undefined;
      smartAccountDeployed = await isSmartAccountDeployed(client, address);
      if (smartAccountDeployed) return undefined;
      // return factoryAddress
    },
    async getFactoryData() {
      if (smartAccountDeployed) return undefined;
      smartAccountDeployed = await isSmartAccountDeployed(client, address);
      if (smartAccountDeployed) return undefined;
      // return getAccountInitCode(viemSigner.address, index)
    },
    async encodeDeployCallData(_: any) {
      throw new Error("Daimo account doesn't support account deployment");
    },
    async encodeCallData(args) {
      if (Array.isArray(args)) {
        const callsArray = args.map((call) => {
          return {
            dest: call.to,
            value: call.value,
            data: call.data,
          };
        }) as DaimoAccountCall[];

        return encodeFunctionData({
          abi: daimoAccountABI,
          functionName: "executeBatch",
          args: [callsArray],
        });
      }

      const { to, value, data } = args as {
        to: Address;
        value: bigint;
        data: Hex;
      };

      const call: DaimoAccountCall = {
        dest: to,
        value,
        data,
      };

      return encodeFunctionData({
        abi: daimoAccountABI,
        functionName: "executeBatch",
        args: [[call]],
      });
    },
    async getDummySignature(_userOperation: any) {
      return "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c";
    },
  });
}
