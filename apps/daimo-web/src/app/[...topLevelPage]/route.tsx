const superSo = "https://daimo.super.site";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const upstreamUrl = request.url.replace(url.origin, superSo);
  console.log(`[WEB] proxying ${request.url} to ${upstreamUrl}`);

  // Proxy the request to superSo, setting the Host header to daimo.xyz
  // Return the response
  const res = await fetch(upstreamUrl, {
    method: request.method,
    headers: {
      ...request.headers,
      Host: "daimo.super.site",
    },
  });

  const resBody = await res.blob();
  console.log(`[WEB] got ${res.status} ${res.statusText}, ${resBody.size}b`);

  const headers = new Headers();
  for (const [key, value] of res.headers.entries()) {
    if (key === "content-encoding") continue;
    if (key.startsWith("x-")) continue;
    headers.set(key, value);
  }

  return new Response(resBody, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}
