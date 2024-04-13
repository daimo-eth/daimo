export type CreateInviteLinkPayload = {
  code: string;
  bonusDollarsInvitee: number;
  bonusDollarsInviter: number;
  maxUses: number;
  inviter: string;
};
