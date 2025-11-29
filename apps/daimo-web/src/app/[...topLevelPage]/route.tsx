const superSo = "https://daimo.super.site";

export async function GET(request: Request) {
  const url = new URL(request.url);

  // Redirect daimo.xyz to daimo.com
  if (url.hostname === "daimo.xyz") {
    url.hostname = "daimo.com";
    return Response.redirect(url, 301);
  }

  // Otherwise proxy the request to our notion super.so
  const upstreamUrl = request.url.replace(url.origin, superSo);
  console.log(`[WEB] proxying ${request.url} to ${upstreamUrl}`);

  // Proxy the request to super.so
  const res = await fetch(upstreamUrl, {
    method: request.method,
  });

  const resBody = await res.blob();
  console.log(`[WEB] got ${res.status} ${res.statusText}, ${resBody.size}b`);

  // Rewrite /_next/... URLs to superSo/_next/...
  const contentType = res.headers.get("content-type") || "";
  let retBody: string | ArrayBuffer;
  if (contentType.includes("text/html")) {
    console.log(`[WEB] rewriting /_next/ URLs in ${upstreamUrl}`);
    const initHtml = await resBody.text();
    retBody = initHtml.replace(/\/_next\//g, `${superSo}/_next/`);
  } else if (contentType.startsWith("text/")) {
    retBody = await resBody.text();
  } else {
    retBody = await resBody.arrayBuffer();
  }

  const headers = new Headers();
  for (const [key, value] of res.headers.entries()) {
    if (key === "content-encoding") continue;
    if (key === "transfer-encoding") continue;
    if (key.startsWith("x-")) continue;
    headers.set(key, value);
  }

  const lengthStr =
    typeof retBody === "string"
      ? `${retBody.length}ch string`
      : `${retBody.byteLength}b buffer`;
  console.log(`[WEB] returning ${lengthStr}, ${headers.toString()}`);

  return new Response(retBody, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}
