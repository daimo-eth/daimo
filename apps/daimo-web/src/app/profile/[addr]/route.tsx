import { NextResponse } from "next/server";
import sharp from "sharp";

import { rpc } from "../../../utils/rpc";

// @ts-ignore
export async function GET(request: Request, { params }) {
  try {
    const res = await rpc.getEthereumAccount.query({ addr: params.addr });

    if (res.profilePicture) {
      const data = await fetch(res.profilePicture);
      const blob = await data.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const result = await sharp(buffer).resize(64, 64).toBuffer();
      const resultBlob = new Blob([result], { type: "image/jpeg" });
      const response = new NextResponse(resultBlob);
      response.headers.set("Content-Type", "image/jpeg");

      return response;
    }
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
