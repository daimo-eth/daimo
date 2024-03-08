import { NextResponse } from "next/server";

import { rpc } from "../../../utils/rpc";

// @ts-ignore
export async function GET(request: Request, { params }) {
  try {
    const res = await rpc.getEthereumAccount.query({ addr: params.addr });

    if (res.profilePicture) {
      const data = await fetch(res.profilePicture);

      const response = new NextResponse(await data.blob());
      response.headers.set("Content-Type", "image/jpeg");

      return response;
    }
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
