import { LRUCache } from "lru-cache";
import { NextResponse } from "next/server";
import sharp from "sharp";

import { rpc } from "../../../utils/rpc";

type Context = {
  params: { addr: string };
};

const pfpCache = new LRUCache<string, Blob>({
  ttl: 1000 * 60 * 60 * 24, // Cached pfps should last one day
  ttlAutopurge: false, // For perf, let items fall out naturally
  max: 1000,
});

export async function GET(_: Request, { params }: Context) {
  const addr = params.addr[0];

  try {
    let resultBlob: Blob | undefined = undefined;
    let contentType: string | undefined = undefined;
    const cachedBlob = pfpCache.get(addr);

    if (pfpCache.get(addr)) {
      resultBlob = cachedBlob;
    } else {
      const res = await rpc.getEthereumAccount.query({ addr: params.addr[0] });
      const profilePicture = res.linkedAccounts?.[0]?.pfpUrl;

      if (profilePicture) {
        const data = await fetch(profilePicture);
        contentType = data.headers.get("Content-Type") ?? undefined;
        const blob = await data.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const result = await sharp(buffer).resize(64, 64).toBuffer();
        resultBlob = new Blob([result], { type: contentType });
      }
    }

    if (resultBlob) {
      const response = new NextResponse(resultBlob);
      if (contentType) {
        response.headers.set("Content-Type", contentType);
      }
      return response;
    }

    return NextResponse.json({ error: "No image found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
