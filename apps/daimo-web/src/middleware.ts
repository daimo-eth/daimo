import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { detectPlatform, downloadMetadata } from "./utils/platform";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/l/download") {
    return redirectMobileToAppStore(request);
  }
  return NextResponse.next();
}

function redirectMobileToAppStore(request: NextRequest) {
  const ua = request.headers.get("user-agent") || "";
  const platform = detectPlatform(ua);
  const { url } = downloadMetadata[platform];
  return NextResponse.redirect(url);
}
