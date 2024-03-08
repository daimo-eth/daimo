import { NextResponse } from "next/server";
import sharp from "sharp";

import { rpc } from "../../../utils/rpc";

export async function GET(_: Request, { params }: any) {
  try {
    const res = await rpc.getEthereumAccount.query({ addr: params.addr });
    const profilePicture = res.linkedAccounts?.[0]?.pfpUrl;

    if (profilePicture) {
      const data = await fetch(profilePicture);
      const blob = await data.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const result = await sharp(buffer).resize(64, 64).toBuffer();
      const resultBlob = new Blob([result], { type: "image/jpeg" });
      const response = new NextResponse(resultBlob);
      response.headers.set("Content-Type", "image/jpeg");

      return response;
    }

    return NextResponse.json({ error: "No image found" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
