import { detectPlatform, downloadMetadata } from "../../utils/platform";

export async function GET(request: Request) {
  // if ios or android, redirect to app store
  const ua = request.headers.get("user-agent") || "";
  const redirectURL = downloadMetadata[detectPlatform(ua)].url;

  return Response.redirect(redirectURL, 301);
}
