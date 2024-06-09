import { getAddress } from "viem";

import { detectPlatform } from "../../utils/platform";
import { rpc } from "../../utils/rpc";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const addr = searchParams.get("addr")!;
  const ua = request.headers.get("user-agent") || "";

  const res = await rpc.getBinanceWithdrawalURL.query({
    addr: getAddress(addr),
    os: detectPlatform(ua),
  });

  if (!res) {
    return new Response("Binance is only supported on iOS and Android", {
      status: 200,
    });
  }

  return Response.redirect(res, 301);
}
