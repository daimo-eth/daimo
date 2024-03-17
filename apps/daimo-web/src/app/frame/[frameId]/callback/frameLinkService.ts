import { assertNotNull } from "@daimo/common";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { User } from "@neynar/nodejs-sdk/build/neynar-api/v2";
import { NextRequest, NextResponse } from "next/server";

import { assert, FarcasterCacheClient } from "./farcasterClient";
import { getAbsoluteUrl } from "../../../../utils/getAbsoluteUrl";
import { rpc } from "../../../../utils/rpc";
import { InviteFrameLink, inviteFrameLinks } from "../../frameLink";
import { FrameRequest, getFrameHtmlResponse } from "../../frameUtils";

let envFrameLinkService: FrameLinkService | null = null;

export function getFrameLinkServiceFromEnv(): FrameLinkService {
  if (envFrameLinkService == null) {
    // Connect to Farcaster
    const neynarApiKey = process.env.DAIMO_NEYNAR_KEY || null;
    assert(neynarApiKey != null, "Missing DAIMO_NEYNAR_KEY");
    const neynarClient = new NeynarAPIClient(neynarApiKey);
    const fcClient = new FarcasterCacheClient(neynarClient);

    envFrameLinkService = new FrameLinkService(neynarClient, fcClient);
  }

  return envFrameLinkService;
}

export class FrameLinkService {
  constructor(
    private neynarClient: NeynarAPIClient,
    private fcClient: FarcasterCacheClient
  ) {}

  // Handle a frame button click
  async respond(req: NextRequest, frameId: number): Promise<NextResponse> {
    const { neynarClient, fcClient } = this;

    const body: FrameRequest = await req.json();
    const { valid, action } = await neynarClient.validateFrameAction(
      body.trustedData.messageBytes
    );
    console.log("Frame request. valid? " + valid);

    if (!valid) throw new Error("Invalid frame request");

    // The frame being clicked on
    // TODO: load from  URL
    const frame = inviteFrameLinks.find((l) => l.id === frameId);
    if (frame == null)
      throw new Error(`Unknown frame: ${req.nextUrl.pathname}`);

    // The user who clicked
    const { fid } = action.interactor;
    const user = await fcClient.getUser(fid);

    // Should we give them a Daimo invite?
    const allowed = await this.auth(user, frame);
    const allowStr = allowed ? "ALLOWED" : "disallowed";
    console.log(
      `[FRAME] frame click from ${fid} @${user.username} ${allowStr}`
    );

    // Create a single-use invite link specific to this user (fid)
    const inviteUrl = allowed && (await this.createInviteLink(fid, frame));

    // Success = user allowed, invite link found or created
    if (inviteUrl) return this.successResponse(inviteUrl);
    return this.cantMilkResponse(frameId);
  }

  private async auth(user: User, frame: InviteFrameLink): Promise<boolean> {
    if (frame.allowFidsBelow && user.fid < frame.allowFidsBelow) return true;
    // TODO: check if frame owner follows user
    return false;
  }

  // Hits Daimo API to create an invite link for a given key
  private async createInviteLink(
    fid: number,
    frame: InviteFrameLink
  ): Promise<string> {
    const code = `fc-${fid}`;
    const apiKey = assertNotNull(process.env.DAIMO_API_KEY);

    console.log(`[FRAME] creating invite code ${code}`);
    const link = await rpc.createInviteLink.mutate({
      apiKey,
      code,
      maxUses: 1,
      inviter: frame.owner.addr,
      bonusDollarsInvitee: frame.bonusDollarsInvitee,
      bonusDollarsInviter: 0,
    });
    console.log(`[FRAME] created invite: ${link}`);
    return link;
  }

  private successResponse(payLink: string): NextResponse {
    return new NextResponse(
      getFrameHtmlResponse({
        buttons: [
          {
            label: `✳️ Accept Invite + USDC`,
            action: "post_redirect",
          },
        ],
        image: getAbsoluteUrl(`/assets/frame/daimoo-success.png`),
        post_url: payLink,
      })
    );
  }

  private cantMilkResponse(frameId: number): NextResponse {
    const msgs = [
      "Moo-ve along, butter luck next time.",
      "You must be udderly disappointed.",
      "You're really milking my patience here.",
      "Moo-ve along, human.",
      "Another click, another empty pail.",
    ];
    const msg = msgs[Math.floor(Math.random() * msgs.length)];

    return new NextResponse(
      getFrameHtmlResponse({
        buttons: [
          {
            label: `🐄 ` + msg,
          },
        ],
        image: getAbsoluteUrl(`/assets/frame/daimoo-fail.png`),
        post_url: getAbsoluteUrl(`/frame/${frameId}/callback`),
      })
    );
  }
}
