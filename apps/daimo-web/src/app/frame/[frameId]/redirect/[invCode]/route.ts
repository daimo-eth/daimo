import { formatDaimoLink } from "@daimo/common";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { frameId: string; invCode: string } }
): Promise<Response> {
  const frameId = Number(params.frameId);
  const url = formatDaimoLink({ type: "invite", code: params.invCode });
  console.log(`[REDIRECT] redirecting frame ${frameId} to invite ${url}`);
  return new NextResponse("", { status: 302, headers: { location: url } });
}

export const dynamic = "force-dynamic";
