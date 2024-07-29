import { NextRequest } from "next/server";
import { getAddress } from "viem";

import { getI18N } from "../../../../../i18n";
import { getReqLang } from "../../../../../i18n/server";
import { InviteFrameLink } from "../../../frameLink";
import { getFrameLinkServiceFromEnv } from "../../../frameLinkService";

export async function POST(
  req: NextRequest,
  { params }: { params: { addr: string } }
): Promise<Response> {
  const i18n = getI18N(req.headers.get("accept-language"));
  const i18 = i18n.frame.invite.callback;
  const addr = getAddress(params.addr);
  const service = getFrameLinkServiceFromEnv();
  const action = await service.validateFrameAction(req);

  const frame: InviteFrameLink = {
    id: 0,
    owner: { addr },
    bonusDollarsInvitee: 10,
    bonusDollarsInviter: 0,
    auth: {
      mustBePowerUser: true,
    },
    appearance: {
      imgInit: "/assets/frame/InvInitPowerUser.png",
      imgSuccess: "/assets/frame/InvFrameSuccess.png",
      imgFail: "/assets/frame/InvFrameFail.png",
      buttonInit: "",
      buttonSuccess: i18.welcomeClaimInvite(),
    },
  };

  return service.respondToFrameClick(action, frame);
}

export const dynamic = "force-dynamic";
