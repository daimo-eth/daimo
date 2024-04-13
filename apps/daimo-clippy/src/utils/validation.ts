import z from "zod";

export const NUMBER_KEYS = [
  "bonus_dollars_invitee",
  "bonus_dollars_inviter",
  "max_uses",
];

export const keyMap = {
  code: "code",
  bonus_dollars_invitee: "bonusDollarsInvitee",
  bonus_dollars_inviter: "bonusDollarsInviter",
  max_uses: "maxUses",
  inviter: "inviter",
} as const;

export const CreateInviteSchema = z.object({
  code: z.string(),
  bonusDollarsInvitee: z.number(),
  bonusDollarsInviter: z.number(),
  maxUses: z.number(),
  inviter: z.string(),
});
