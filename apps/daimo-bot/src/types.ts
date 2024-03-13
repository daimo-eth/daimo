import { EAccount } from "@daimo/common";
import { EmbeddedCast } from "@neynar/nodejs-sdk/build/neynar-api/v2";

export type TRPCClient = {
  createRequestSponsored: {
    mutate: (input: {
      amount: string;
      recipient: string;
      idString: string;
    }) => Promise<string>;
  };
  lookupEthereumAccountByFid: {
    query: (args: { fid: number }) => Promise<EAccount | null>;
  };
};

export type SendCastOptions = {
  embeds?: EmbeddedCast[];
  replyTo?: string;
  channelId?: string;
};

export type WebhookEvent = {
  created_at: number;
  type: string;
  data: CastData;
};

export type CastData = {
  object: string;
  hash: string;
  thread_hash: string;
  parent_hash: string | null;
  parent_url: string;
  root_parent_url: string;
  parent_author: {
    fid: number | null;
  };
  author: Author;
  text: string;
  timestamp: string;
  embeds: any[];
  reactions: {
    likes: any[];
    recasts: any[];
  };
  replies: {
    count: number;
  };
  mentioned_profiles: any[];
};

export type Author = {
  object: string;
  fid: number;
  custody_address: string;
  username: string;
  display_name: string;
  pfp_url: string;
  profile: any;
  follower_count: number;
  following_count: number;
  verifications: string[];
  active_status: string;
};
