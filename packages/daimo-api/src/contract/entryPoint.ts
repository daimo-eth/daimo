import { entryPointABI } from "@daimo/contract";
import { Constants } from "userop";
import {
  Account,
  Chain,
  Hex,
  Transport,
  WalletClient,
  getContract,
} from "viem";

import { ClientsType, ContractType, getClients } from "../chain";

/* 4337 EntryPoint. Prefunds Daimo accounts, as a stopgap till we have a paymaster. */
export class EntryPoint {
  clients: ClientsType;
  contract: ContractType<typeof entryPointABI>;

  constructor(walletClient: WalletClient<Transport, Chain, Account>) {
    this.clients = getClients(walletClient);
    this.contract = getContract({
      abi: entryPointABI,
      address: Constants.ERC4337.EntryPoint as Hex,
      ...this.clients,
    });
  }

  /** Prefunds an account's gas, depositing ETH with the EntryPoint. */
  async prefundEth(address: Hex, value: bigint) {
    const { write } = this.contract;
    const depositTxHash = await write.depositTo([address], { value });
    console.log(`[API] faucet prefund: ${depositTxHash}`);

    const receipt = await this.clients.publicClient.waitForTransactionReceipt({
      hash: depositTxHash,
      timeout: 30000,
    });
    console.log(`[API] faucet prefund ${receipt.status}`);
  }
}
