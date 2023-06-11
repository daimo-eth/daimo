import { accountFactoryConfig } from "@daimo/contract";
import {
  Account,
  Chain,
  Hex,
  Transport,
  WalletClient,
  getContract,
} from "viem";

import { ClientsType, ContractType, getClients } from "../chain";

/* Interface to the AccountFactory contract. Creates Daimo accounts. */
export class AccountFactory {
  clients: ClientsType;
  contract: ContractType<typeof accountFactoryConfig.abi>;

  constructor(walletClient: WalletClient<Transport, Chain, Account>) {
    this.clients = getClients(walletClient);
    this.contract = getContract({ ...accountFactoryConfig, ...this.clients });
  }

  async deploy(pubKeyHex: string) {
    const pubKey = Buffer.from(pubKeyHex.substring(2), "hex");
    if (pubKey.length !== 65 || pubKey[0] !== 0x04) {
      throw new Error("Invalid public key");
    }
    const key1 = `0x${pubKey.subarray(1, 33).toString("hex")}` as Hex;
    const key2 = `0x${pubKey.subarray(33).toString("hex")}` as Hex;
    const salt = 0n;
    const deployArgs = [[key1, key2], salt] as const;
    const hash = await this.contract.write.createAccount(deployArgs);
    console.log(`[API] deploy transaction ${hash}`);

    const { publicClient } = this.clients;
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`[API] deploy transaction ${receipt.status}`);
    if (receipt.status !== "success") {
      return { status: "reverted" as const };
    }

    // Compute CREATE2 deployment address
    // TODO: would prefer to just execute, but viem does support return values
    const address = await this.contract.read.getAddress([[key1, key2], salt]);

    return { status: "success" as const, address };
  }
}
