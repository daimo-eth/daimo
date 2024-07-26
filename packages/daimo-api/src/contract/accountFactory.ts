import { assert, derKeytoContractFriendlyKey } from "@daimo/common";
import {
  daimoAccountFactoryV2Config,
  daimoCCTPBridgerAddress,
  daimoFlexSwapperAddress,
} from "@daimo/contract";
import { Address, Hex, isAddress, TransactionReceipt } from "viem";

import { chainConfig } from "../env";
import { ViemClient } from "../network/viemClient";

const SALT = 0n; // Daimo Account Factory salt, always 0.

/* Interface to the DaimoAccountFactory contract. Creates Daimo accounts. */
export class AccountFactory {
  constructor(private vc: ViemClient) {}

  /**
   * Takes a DER P256 public key.
   * Returns the CREATE2 deployment address for Daimo account with that as it's initial signing key.
   * We don't use Entrypoint's getSenderAddress because it's too complicated. Daimo Accounts have a
   * simpler getAddress function that we can use instead.
   */
  async getAddress(pubKeyHex: Hex) {
    // In the future, home chain and home coin will be configurable by the user.
    // For now, always deploy to with Base as home chain, USDC as home coin.
    const homeChainID = BigInt(chainConfig.chainL2.id);
    const homeCoinAddr = chainConfig.tokenAddress;
    const keySlot = 0;
    const key = derKeytoContractFriendlyKey(pubKeyHex);

    const address = await this.vc.publicClient.readContract({
      ...daimoAccountFactoryV2Config,
      functionName: "getAddress",
      args: [
        homeChainID,
        homeCoinAddr,
        daimoFlexSwapperAddress,
        daimoCCTPBridgerAddress,
        keySlot,
        key,
        SALT,
      ],
    });
    assert(isAddress(address));
    return address;
  }

  /**
   * Takes a DER P256 public key.
   * Deploys a new Daimo account with that as it's initial signing key.
   */
  async deploy(pubKeyHex: Hex): Promise<TransactionReceipt> {
    const homeChainID = BigInt(chainConfig.chainL2.id);
    const homeCoinAddr = chainConfig.tokenAddress;
    const keySlot = 0;
    const key = derKeytoContractFriendlyKey(pubKeyHex);

    const hash = await this.vc.writeContract({
      ...daimoAccountFactoryV2Config,
      functionName: "createAccount",
      args: [
        homeChainID,
        homeCoinAddr,
        daimoFlexSwapperAddress,
        daimoCCTPBridgerAddress,
        keySlot,
        key,
        SALT,
      ],
    });
    console.log(`[API] deploy transaction ${hash}`);

    const { publicClient } = this.vc;
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`[API] deploy transaction status ${receipt.status}`);

    return receipt;
  }

  /** Get the account contract version for a given Daimo address. */
  async getAccountVersion(address: Address): Promise<"v1" | "v2"> {
    const { publicClient } = this.vc;
    const erc1967ImplSlot =
      "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
    const implAddr = await publicClient.getStorageAt({
      address,
      slot: erc1967ImplSlot,
    });

    switch (implAddr) {
      case "0x000000000000000000000000652d07389ac2ead07222e7965d30ec0b2700b388":
        return "v1";
      case "0x000000000000000000000000977ff48bbd374cb9df86dbd229eb14260154b636":
        return "v2";
      case undefined:
        throw new Error(`not an ERC1967Proxy: ${address}`);
      default:
        throw new Error(`account ${address} has unknown impl ${implAddr}`);
    }
  }
}
