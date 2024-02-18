import {
  AppClient,
  createAppClient,
  viemConnector,
  StatusAPIResponse,
} from "@daimo/auth-client";
import { FarcasterLinkedAccount, assertNotNull } from "@daimo/common";
import { Address, Hex } from "viem";

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

    console.log(`[FARCASTER] initializing`);
    this.appClient = createAppClient({
      relay: "https://relay.farcaster.xyz",
      ethereum: viemConnector({ rpcUrl: "https://mainnet.optimism.io" }),
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

  async watchStatus({ channelToken }: { channelToken: string }) {
    const appClient = this.init();
    console.log(`[FARCASTER] watching status for channel ${channelToken}`);
    const ret = await appClient.watchStatus({ channelToken });

    if (ret.isError) console.error(`[FARCASTER] login failed`, ret.error);
    else console.log(`[FARCASTER] login success`, JSON.stringify(ret.data));

    return ret;
  }

  static getLinkedAccount(data: StatusAPIResponse): FarcasterLinkedAccount {
    return {
      type: "farcaster",
      fid: assertNotNull(data.fid, "Missing FID"),
      custody: assertNotNull(data.custody, "Missing Farcaster custody address"),
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
