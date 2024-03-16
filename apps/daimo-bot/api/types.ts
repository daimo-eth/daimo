import { EmbeddedCast } from "@neynar/nodejs-sdk/build/neynar-api/v2";

import { trpcClient } from "./trpcClient";

export type TRPCClient = typeof trpcClient;

export type SendCastOptions = {
  embeds?: EmbeddedCast[];
  replyTo?: string;
  channelId?: string;
};

export type WebhookEvent = {
  data: CastData;
  // created_at: number;
  // type: string;
};

export type CastData = {
  object: string;
  hash: string;
  parent_author: {
    fid: number | null;
  };
  author: Author;
  text: string;
  timestamp: string;
  // thread_hash: string;
  // parent_hash: string | null;
  // parent_url: string;
  // root_parent_url: string;
  // embeds: any[];
  // reactions: {
  //   likes: any[];
  //   recasts: any[];
  // };
  // replies: {
  //   count: number;
  // };
  // mentioned_profiles: any[];
};

export type Author = {
  fid: number;
  username: string;
  // object: string;
  // custody_address: string;
  // display_name: string;
  // pfp_url: string;
  // profile: any;
  // follower_count: number;
  // following_count: number;
  // verifications: string[];
  // active_status: string;
};
