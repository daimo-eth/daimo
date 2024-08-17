import { getI18N } from "../../i18n";
import { detectPlatform, getDownloadMetadata } from "../../utils/platform";

export async function GET(request: Request) {
  // if ios or android, redirect to app store
  const downloadMetadata = getDownloadMetadata(getI18N("en"));
  const ua = request.headers.get("user-agent") || "";
  const redirectURL = downloadMetadata[detectPlatform(ua)].url;

  return Response.redirect(redirectURL, 301);
}
