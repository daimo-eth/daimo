import {
  assertNotNull,
  EAccount,
  getAccountName,
  parseDaimoLink,
} from "@daimo/common";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import {
  User,
  UserViewerContext,
} from "@neynar/nodejs-sdk/build/neynar-api/v2";
import { NextRequest, NextResponse } from "next/server";

import { assert, FarcasterCacheClient } from "./farcasterClient";
import { InviteFrameLink, inviteFrameLinks } from "./frameLink";
import { FrameRequest, getFrameHtmlResponse } from "./frameUtils";
import { getAbsoluteUrl } from "../../utils/getAbsoluteUrl";
import { rpc } from "../../utils/rpc";

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

  // Load frame by ID
  async loadFrame(frameId: number): Promise<InviteFrameLink | undefined> {
    const frame = inviteFrameLinks.find((l) => l.id === frameId);
    return frame;
  }

  // Handle a frame button click
  async respond(req: NextRequest, frameId: number): Promise<NextResponse> {
    const { neynarClient, fcClient } = this;

    const body: FrameRequest = await req.json();
    const { valid, action } = await neynarClient.validateFrameAction(
      body.trustedData.messageBytes,
      { followContext: true }
    );
    console.log("Frame request. valid? " + valid);

    if (!valid) throw new Error("Invalid frame request");

    // The frame being clicked on
    const frame = inviteFrameLinks.find((l) => l.id === frameId);
    if (frame == null) {
      throw new Error(`Unknown frame: ${req.nextUrl.pathname}`);
    }

    // The user who clicked
    const { fid } = action.interactor;
    const user = await fcClient.getUser(fid);
    const viewerContext = assertNotNull(action.interactor.viewer_context);

    // Should we give them a Daimo invite?
    const [allowed, authMsg] = await this.auth(user, frame, viewerContext);
    const allowStr = allowed ? "ALLOWED" : "disallowed";
    console.log(
      `[FRAME] frame click from ${fid} @${user.username} ${allowStr} ${authMsg}`
    );

    // Create a single-use invite link specific to this user (fid)
    const inviteUrl = allowed && (await this.createInviteLink(fid, frame));

    // Success = user allowed, invite link found or created
    if (inviteUrl) return this.successResponse(frame, inviteUrl, authMsg);
    return this.failResponse(frame, authMsg);
  }

  // Check whether this Farcaster user gets a Daimo invite from this frame
  private async auth(
    user: User,
    frame: InviteFrameLink,
    viewerContext: UserViewerContext
  ): Promise<[boolean, string]> {
    const { auth, owner } = frame;
    if (auth.fidMustBeBelow && user.fid > auth.fidMustBeBelow) {
      return [false, "Sorry, fid too high"];
    } else if (auth.claimerMustFollowOwner && !viewerContext.following) {
      return [false, `Gotta follow ${getAccountName(frame.owner)} first`];
    } else if (auth.ownerMustFollow && !viewerContext.followed_by) {
      return [false, `${getAccountName(owner)} doesn't follow you`];
    }
    for (const whitelist of auth.fidWhitelists || []) {
      if (whitelist.fids.includes(user.fid)) {
        return [true, whitelist.greeting];
      }
    }
    if ((auth.fidWhitelists || []).length > 0) {
      return [false, "Sorry, not on the list"];
    }
    return [true, frame.appearance.buttonSuccess];
  }

  // Check if the user is followed by the link owner
  private async isFollowedBy(user: User, owner: EAccount): Promise<boolean> {
    const { fid, username: ownerUsername } = assertNotNull(
      owner.linkedAccounts?.[0],
      `Invite Frame owner ${owner.name} doesn't have a linked FC`
    );
    console.log(
      `[FRAME] checking if @${ownerUsername} follows @${user.username}`
    );

    const resp = await this.neynarClient.fetchRelevantFollowers(fid, user.fid);
    const follower = resp.all_relevant_followers_dehydrated.find(
      (f) => f.user?.fid === user.fid
    );
    return follower != null;
  }

  // Hits Daimo API to create an invite link for a given key
  private async createInviteLink(
    fid: number,
    frame: InviteFrameLink
  ): Promise<string> {
    const rand = Buffer.from(
      crypto.getRandomValues(new Uint8Array(6))
    ).toString("hex");

    const code = `fc-${frame.id}-${fid}-${rand}`;
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

  private successResponse(
    frame: InviteFrameLink,
    inviteLink: string,
    authMsg: string
  ) {
    const link = parseDaimoLink(inviteLink);
    assert(link != null && link.type === "invite");
    const redirURL = getAbsoluteUrl(`/frame/${frame.id}/redirect/${link.code}`);
    console.log(`[FRAME] success, sending invite code ${redirURL}`);

    return new NextResponse(
      getFrameHtmlResponse({
        buttons: [
          {
            label: `✳️ ${authMsg}`,
            action: "post_redirect",
          },
        ],
        image: getAbsoluteUrl(frame.appearance.imgSuccess),
        post_url: redirURL,
      })
    );
  }

  private failResponse(frame: InviteFrameLink, authMsg: string): NextResponse {
    return new NextResponse(
      getFrameHtmlResponse({
        buttons: [
          {
            label: `❌ ${authMsg}`,
          },
        ],
        image: getAbsoluteUrl(frame.appearance.imgFail),
        post_url: getAbsoluteUrl(`/frame/${frame.id}/callback`),
      })
    );
  }
}
