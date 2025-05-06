import { teamDaimoFaucetAddr } from "@daimo/contract";

import { DB } from "../db/db";
import { InviteCodeTracker } from "../offchain/inviteCodeTracker";
import { Telemetry } from "../server/telemetry";

function generateMailtoURL(
  email: string,
  name: string,
  inviteLink: string
): string {
  const to = email;
  const bcc = "invite@daimo.com";
  const subject = encodeURIComponent("Daimo Invite");
  const body = encodeURIComponent(
    `Hi ${name},\n\n` +
      `You signed up for our waitlist earlier.\n\n` +
      `Here's your Daimo invite: ${inviteLink}\n\n` +
      `It'll get you started with $10 USDC from us. Try it and let us know what you think.\n\n` +
      `Best,\n` +
      `Team Daimo`
  );

  const mailtoURL = `mailto:${to}?bcc=${bcc}&subject=${subject}&body=${body}`;
  return mailtoURL;
}

export async function submitWaitlist(
  name: string,
  email: string,
  socials: string,
  db: DB,
  telemetry: Telemetry,
  inviteCodeTracker: InviteCodeTracker
) {
  await db.insertWaitlist(name, email, socials);

  const code = Array(8)
    .fill(0)
    .map(() => "abcdefghijklmnopqrstuvwxyz"[(Math.random() * 26) | 0])
    .join("");

  const inviteLink = await inviteCodeTracker.insertInviteCode({
    code,
    maxUses: 1,
    bonusDollarsInvitee: 10,
    bonusDollarsInviter: 0,
    inviter: teamDaimoFaucetAddr,
  });

  const mailToURL = generateMailtoURL(email, name, inviteLink);

  const message = `New waitlist signup: ${name}, ${email}, ${socials}\n\n<${mailToURL}|Click here to send an email>`;

  telemetry.recordClippy(message, "celebrate");
}
