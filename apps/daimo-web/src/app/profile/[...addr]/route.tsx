import { LRUCache } from "lru-cache";
import { NextResponse } from "next/server";
import sharp from "sharp";

import { getI18N } from "../../../i18n";
import { getReqLang } from "../../../i18n/server";
import { rpc } from "../../../utils/rpc";

type Context = {
  params: { addr: string };
};

const pfpCache = new LRUCache<string, Blob>({
  ttl: 1000 * 60 * 60 * 24, // Cached pfps should last one day
  ttlAutopurge: false, // For perf, let items fall out naturally
  max: 1000,
});

// Opt out of caching for all data requests in the route segment
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: Context) {
  const addr = params.addr[0];

  const i18n = getI18N(getReqLang());
  const i18 = i18n.profile;

  try {
    let result: Blob | undefined = undefined;
    if (pfpCache.has(addr)) {
      result = pfpCache.get(addr);
    } else {
      result = await loadPFP(addr);
      pfpCache.set(addr, result);
    }

    if (result == null) {
      console.warn(`[PROFILE] No image found for ${addr}`);

      return NextResponse.json({ error: i18.errorNoImage() }, { status: 404 });
    }

    console.log(`[PROFILE] returning ${result.size}b PFP for ${addr}`);
    const response = new NextResponse(result);
    response.headers.set("Content-Type", result.type);
    return response;
  } catch (error) {
    console.error(`[PROFILE] error fetching PFP for ${addr}`, error);
    return NextResponse.json({ error }, { status: 500 });
  }
}

async function loadPFP(addr: string): Promise<Blob | undefined> {
  console.log(`[PROFILE] cache miss, looking up PFP for ${addr}`);
  const res = await rpc.getEthereumAccount.query({ addr });
  const profilePicture = res.linkedAccounts?.[0]?.pfpUrl;

  if (profilePicture == null) {
    console.warn(`[PROFILE] no PFP for ${addr}: ${JSON.stringify(res)}`);
    return undefined;
  }

  console.log(`[PROFILE] fetching PFP for ${addr}: ${profilePicture}`);
  const data = await fetch(profilePicture);
  const origBlob = await data.blob();
  const buffer = Buffer.from(await origBlob.arrayBuffer());

  // Resize to specified size & format
  const result = await sharp(buffer).resize(128, 128).webp().toBuffer();
  const blob = new Blob([result], { type: "image/webp" });

  return blob;
}
