import { NextResponse } from "next/server";

import { search } from "../../../lib/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  const results = await search(q);
  console.log(`[EXP-API] search: ${results.length} results for ${q}`);

  return NextResponse.json(results);
}
