import { cctpMessageTransmitterABI } from "@daimo/contract";
import { Pool } from "pg";
import { Hex } from "viem";

import { Indexer } from "./indexer";
import { chainConfig } from "../env";
import { ViemClient } from "../network/viemClient";
import { retryBackoff } from "../utils/retryBackoff";

// Mapping from Ethereum Chain ID to CCTP domain ID
// as in https://developers.circle.com/stablecoins/docs/supported-domains
const chainIdToCCTPDomain: Record<number, number> = {
  1: 0, // Ethereum mainnet
  10: 2, // Optimism
  42161: 3, // Arbitrum
  8453: 6, // Base
  137: 7, // Polygon
};

// Messages are uniquely identified by (sourceDomain, eventNonce)
export type CCTPDepositMessage = {
  chainId: number;
  eventNonce: number;
  transactionHash: Hex;
};

export type CCTPAttestation = {
  deposit: CCTPDepositMessage;
  message: Hex;
  attestation: Hex | "PENDING";
};

/* Tracks CCTP messages and receives them on the other end. */
export class CCTPIndexer extends Indexer {
  private pendingMessages = new Map<string, CCTPDepositMessage>();

  constructor(private vc: ViemClient) {
    super("CCTP");
  }

  async load(_: Pool, from: number, to: number) {
    // TODO
    // index DepositForBurn on foreign chains for pendingMessages where
    // mintRecipient == user address and destinationDomain is home chain
    // by (sourceDomain, eventNonce)
    // index MessageReceived on home chain to clear received pending messages
    // with the same (sourceDomain, eventNonce)
  }

  async queryCircleAPI(
    deposit: CCTPDepositMessage
  ): Promise<CCTPAttestation | null> {
    const res = await retryBackoff(
      `cctp-query-message-${deposit.chainId}-${deposit.eventNonce}`,
      async () => {
        const queryURL = `${chainConfig.circleAPIRoot}/messages/${
          chainIdToCCTPDomain[deposit.chainId]
        }/${deposit.transactionHash}`;

        const res = await fetch(queryURL);
        if (!res.ok) return null;

        const messages = (await res.json()) as {
          messages: {
            attestation: Hex | "PENDING";
            message: Hex;
            eventNonce: `${number}`;
          }[];
        };

        const message = messages.messages.find(
          (m) => Number(m.eventNonce) === deposit.eventNonce
        );

        if (!message) return null;

        return {
          deposit,
          message: message.message,
          attestation: message.attestation,
        };
      }
    );

    return res;
  }

  async processPendingMessage(message: CCTPDepositMessage) {
    const response = await this.queryCircleAPI(message);
    if (response == null) {
      console.log(
        `[CCTP] no message for ${message.chainId}-${message.eventNonce}`
      );
      return;
    }

    if (response.attestation === "PENDING") {
      console.log(
        `[CCTP] pending attestation for ${message.chainId}-${message.eventNonce}`
      );
      return;
    }

    const txHash = await this.vc.writeContract({
      address: chainConfig.cctpMessageTransmitterAddress,
      abi: cctpMessageTransmitterABI,
      functionName: "receiveMessage",
      args: [response.message, response.attestation],
    });

    console.log(
      `[CCTP] received message ${response.deposit.chainId}-${response.deposit.eventNonce} in ${txHash}`
    );
  }
}
