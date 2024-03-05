import { detectPlatform, downloadMetadata } from "../../utils/platform";

export async function GET(request: Request) {
  // if ios or android, redirect to app store
  const ua = request.headers.get("user-agent") || "";
  if (detectPlatform(ua) === "ios") {
    return Response.redirect(downloadMetadata.ios.url, 301);
  } else if (detectPlatform(ua) === "android") {
    return Response.redirect(downloadMetadata.android.url, 301);
  } else {
    return Response.redirect(downloadMetadata.other.url, 301);
  }
}
