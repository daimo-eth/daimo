import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Int8 = ColumnType<string, bigint | number | string, bigint | number | string>;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface DeclinedRequests {
  created_at: Generated<Timestamp | null>;
  decliner: string;
  request_id: string;
}

export interface ExternalApiCache {
  api_type: string;
  created_at: Timestamp;
  expires_at: Timestamp;
  id: Generated<number>;
  key: string;
  updated_at: Timestamp;
  value: string;
}

export interface Invitecode {
  bonus_cents_invitee: Generated<number>;
  bonus_cents_inviter: Generated<number>;
  code: string;
  created_at: Generated<Timestamp | null>;
  inviter: Generated<string | null>;
  max_uses: Generated<number>;
  use_count: number;
  zupass_email: string | null;
}

export interface InviteGraph {
  created_at: Generated<Timestamp | null>;
  invitee: string;
  inviter: string;
}

export interface LinkedAccount {
  account_json: string | null;
  address: string;
  created_at: Generated<Timestamp | null>;
  linked_id: string | null;
  linked_type: string;
}

export interface NameBlacklist {
  name: string;
}

export interface OffchainAction {
  action_json: string;
  address: string | null;
  created_at: Generated<Timestamp | null>;
  id: Generated<number>;
  signature_hex: string;
  time: Int8;
  type: string;
}

export interface PaymasterWhitelist {
  name: string;
}

export interface PaymentMemo {
  created_at: Generated<Timestamp | null>;
  memo: string;
  ophash_hex: string;
}

export interface PushNotification {
  address: string;
  created_at: Timestamp;
  id: Generated<number>;
  push_json: string;
  push_key: string;
}

export interface Pushtoken {
  address: string;
  pushtoken: string;
}

export interface TagRedirect {
  link: string;
  tag: string;
  update_token: Generated<string | null>;
}

export interface TagRedirectHistory {
  id: Generated<number>;
  link: string;
  tag: string;
  time: Generated<Timestamp>;
  update_token: Generated<string | null>;
}

export interface UsedFaucetAttestations {
  attestation: string;
  created_at: Generated<Timestamp | null>;
}

export interface Waitlist {
  created_at: Generated<Timestamp | null>;
  email: string;
  name: string;
  socials: string;
}

export interface DB {
  declined_requests: DeclinedRequests;
  external_api_cache: ExternalApiCache;
  invite_graph: InviteGraph;
  invitecode: Invitecode;
  linked_account: LinkedAccount;
  name_blacklist: NameBlacklist;
  offchain_action: OffchainAction;
  paymaster_whitelist: PaymasterWhitelist;
  payment_memo: PaymentMemo;
  push_notification: PushNotification;
  pushtoken: Pushtoken;
  tag_redirect: TagRedirect;
  tag_redirect_history: TagRedirectHistory;
  used_faucet_attestations: UsedFaucetAttestations;
  waitlist: Waitlist;
}
