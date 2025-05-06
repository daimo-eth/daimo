import {
  assert,
  assertNotNull,
  formatDaimoLink,
  parseDaimoLink,
} from "@daimo/common";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import {
  User,
  ValidatedFrameAction,
} from "@neynar/nodejs-sdk/build/neynar-api/v2";
import { NextRequest, NextResponse } from "next/server";
import { getAddress } from "viem";

import { FarcasterCacheClient } from "./farcasterClient";
import { InviteFrameLink, inviteFrameLinks } from "./frameLink";
import { FrameRequest, getFrameHtmlResponse } from "./frameUtils";
import { envVarsWeb } from "../../env";
import { getAbsoluteUrl } from "../../utils/getAbsoluteUrl";
import { rpc } from "../../utils/rpc";

let envFrameLinkService: FrameLinkService | null = null;

export function getFrameLinkServiceFromEnv(): FrameLinkService {
  if (envFrameLinkService == null) {
    // Connect to Farcaster
    const neynarApiKey = envVarsWeb.DAIMO_NEYNAR_KEY;
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

  // Validate POST body info = Farcaster user who clicked the frame
  async validateFrameAction(req: NextRequest): Promise<ValidatedFrameAction> {
    const { neynarClient } = this;

    const body: FrameRequest = await req.json();
    const { valid, action } = await neynarClient.validateFrameAction(
      body.trustedData.messageBytes,
      { followContext: true }
    );
    console.log("Frame request. valid? " + valid);

    if (!valid) throw new Error("Invalid frame request");
    return action;
  }

  // Handle a frame button click
  async respond(req: NextRequest, frameId: number): Promise<NextResponse> {
    const action = await this.validateFrameAction(req);

    // The frame being clicked on
    const frame = inviteFrameLinks.find((l) => l.id === frameId);
    if (frame == null) {
      throw new Error(`Unknown frame: ${req.nextUrl.pathname}`);
    }

    return this.respondToFrameClick(action, frame);
  }

  async respondToFrameClick(
    action: ValidatedFrameAction,
    frame: InviteFrameLink
  ): Promise<NextResponse> {
    const { fcClient } = this;

    // The user who clicked
    const { fid } = action.interactor;
    const user = await fcClient.getUser(fid);

    // Should we give them a Daimo invite?
    const [bonus, authMsg] = await this.auth(user, frame);
    const bonusStr = bonus ? "BONUS" : "NO BONUS";
    console.log(
      `[FRAME] frame click from ${fid} @${user.username} ${bonusStr} ${authMsg}`
    );

    // Create a single-use invite link specific to this user (fid)
    const frameWithBonus = bonus
      ? frame
      : { ...frame, bonusDollarsInviter: 0, bonusDollarsInvitee: 0 };
    const inviteUrl = await this.createInviteLink(fid, frameWithBonus);

    // Success = user allowed, invite link found or created
    const buttonText = bonus ? `✳️ ${authMsg}` : `✳️ Claim Invite · ${authMsg}`;
    return this.successResponse(frame, inviteUrl, buttonText);
  }

  // Check whether this Farcaster user gets a Daimo invite from this frame
  private async auth(
    user: User,
    frame: InviteFrameLink
  ): Promise<[boolean, string]> {
    const { auth } = frame;
    console.log(`[FRAME] authenticating ${JSON.stringify(user)}`);

    if (auth.mustBePowerUser && !(user as any).power_badge) {
      return [false, "Not a power user"];
    } else if (auth.fidMustBeBelow && user.fid > auth.fidMustBeBelow) {
      return [false, "FID too high"];
    }
    for (const whitelist of auth.fidWhitelists || []) {
      if (whitelist.fids.includes(user.fid)) {
        return [true, whitelist.greeting];
      }
    }
    if ((auth.fidWhitelists || []).length > 0) {
      return [false, "Not on list"];
    }
    for (const whitelist of auth.addressWhitelists || []) {
      const whitelistAddrs = new Set(
        whitelist.addrs.map((addr) => getAddress(addr))
      );
      const userAddrs = user.verified_addresses.eth_addresses;
      if (userAddrs.some((addr) => whitelistAddrs.has(getAddress(addr)))) {
        return [true, whitelist.greeting];
      }
    }
    if ((auth.addressWhitelists || []).length > 0) {
      return [false, "Not on list"];
    }
    return [true, frame.appearance.buttonSuccess];
  }

  // Hits Daimo API to create an invite link for a given key
  private async createInviteLink(
    fid: number,
    frame: InviteFrameLink
  ): Promise<string> {
    const apiKey = assertNotNull(envVarsWeb.DAIMO_API_KEY, "Set DAIMO_API_KEY");
    const preimage = `${frame.id}-${fid}-${apiKey}`;
    const hash = await crypto.subtle.digest("SHA-256", Buffer.from(preimage));
    const suffix = Buffer.from(hash).toString("hex").substring(0, 6);
    const code = `fc-${frame.id}-${fid}-${suffix}`;

    console.log(`[FRAME] creating invite code ${code}`);
    const link = await rpc.createInviteLink.mutate({
      apiKey,
      code,
      maxUses: 1,
      inviter: frame.owner.addr,
      bonusDollarsInvitee: frame.bonusDollarsInvitee,
      bonusDollarsInviter: frame.bonusDollarsInviter || 0,
    });
    console.log(`[FRAME] created invite: ${link}`);
    return link;
  }

  private successResponse(
    frame: InviteFrameLink,
    inviteLink: string,
    buttonText: string
  ) {
    const link = parseDaimoLink(inviteLink);
    assert(link != null && link.type === "invite");
    const url = formatDaimoLink({ type: "invite", code: link.code });
    console.log(`[FRAME] success, sending invite code ${url}`);

    return new NextResponse(
      getFrameHtmlResponse({
        buttons: [{ label: buttonText, action: "link", target: url }],
        image: getAbsoluteUrl(frame.appearance.imgSuccess),
      })
    );
  }
}
