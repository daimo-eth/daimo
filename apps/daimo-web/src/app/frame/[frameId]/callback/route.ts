import { NextRequest } from "next/server";

import { getFrameLinkServiceFromEnv } from "../../frameLinkService";

export async function POST(
  req: NextRequest,
  { params }: { params: { frameId: string } }
): Promise<Response> {
  const frameId = Number(params.frameId);
  const service = getFrameLinkServiceFromEnv();
  return service.respond(req, frameId);
}

export const dynamic = "force-dynamic";
