// Farcaster AuthKit is currently broken on React Native.
// Use our fork of auth-client instead.
import {
  AppClient,
  StatusAPIResponse,
  createAppClient,
  viemConnector,
} from "@daimo/auth-client";
import { FarcasterLinkedAccount, assertNotNull } from "@daimo/common";

import { getEnvMobile } from "../env";

// Utility to connect to Farcaster.
// See https://docs.farcaster.xyz/auth-kit/client/introduction
export class FarcasterClient {
  // Returns eg "@alice" or "#1234"
  static getDispUsername(profile: FarcasterLinkedAccount): string {
    if (profile.username != null) return `@${profile.username}`;
    else return `#${profile.fid}`;
  }

  private appClient: AppClient | undefined;
  private init(): AppClient {
    if (this.appClient != null) return this.appClient;

    const optimismRpcUrl = getEnvMobile().DAIMO_OPTIMISM_RPC_URL;
    console.log(`[FARCASTER] initializing, optimism RPC: ${optimismRpcUrl}`);
    this.appClient = createAppClient({
      relay: "https://relay.farcaster.xyz",
      ethereum: viemConnector({ rpcUrl: optimismRpcUrl }),
    });

    return this.appClient;
  }

  async connect({ nonce }: { nonce: string }) {
    const appClient = this.init();

    console.log(`[FARCASTER] opening login channel, nonce ${nonce}`);
    const resp = await appClient.createChannel({
      domain: "daimo.com",
      siweUri: "https://daimo.com",
      nonce,
    });

    if (resp.isError) {
      console.error(`[FARCASTER] channel create error`, resp.error);
      throw resp.error;
    }

    console.log(`[FARCASTER] got channel token ${resp.data.channelToken}`);
    return resp.data;
  }

  async watchStatus({
    channelToken,
  }: {
    channelToken: string;
  }): Promise<StatusAPIResponse> {
    const appClient = this.init();
    console.log(`[FARCASTER] watching status for channel ${channelToken}`);

    // Poll for status
    // Do not use watchStatus--it breaks on first dropped connection.
    const delayMs = 1000; // 1 second
    const maxRetries = 300; // 5 minutes
    for (let retry = 1; retry <= maxRetries; retry++) {
      try {
        console.log(
          `[FARCASTER] polling status for channel ${channelToken}, try #${retry}`
        );
        const resp = await appClient.status({ channelToken });
        if (resp.isError) {
          console.error(`[FARCASTER] status error`, resp.error);
        } else {
          const { state } = resp.data;
          console.log(`[FARCASTER] status ${state}`);
          if (state === "completed") return resp.data;
        }
      } catch (e) {
        console.error(`[FARCASTER] polling status error`, e);
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    console.error(`[FARCASTER] polling status timed out`);
    throw new Error(`Farcaster connection timed out`);
  }

  static getLinkedAccount(data: StatusAPIResponse): FarcasterLinkedAccount {
    return {
      type: "farcaster",
      id: assertNotNull(data.custody, "Missing Farcaster custody address"),
      fid: assertNotNull(data.fid, "Missing FID"),
      custody: assertNotNull(data.custody),
      message: assertNotNull(data.message, "Missing Farcaster sig message"),
      signature: assertNotNull(data.signature, "Missing Farcaster sig"),
      verifications: data.verifications || [],
      username: data.username,
      displayName: data.displayName,
      pfpUrl: data.pfpUrl,
      bio: data.bio,
    };
  }
}
