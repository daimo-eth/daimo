import geoIP from "geoip-lite";

import { TrpcRequestContext } from "../server/trpc";

const EU_COUNTRIES = new Set([
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
]);

// Returns the country code of an IP address
function getIpCountry(ipAddr: string): string {
  const ipGeo = geoIP.lookup(ipAddr);
  console.log(`[API] getIpCountry = ${ipGeo?.country}`);
  return ipGeo?.country || "Atlantis";
}

// Returns whether or not the IP is in the given banned areas list.
// Currently, this is used by Tron deposits (only allowed in US and EU).
export function ipInBannedArea(ctx: TrpcRequestContext): boolean {
  let ipAddr = ctx.ipAddr;
  // Handle IPv4-mapped IPv6 addresses
  if (ipAddr.startsWith("::ffff:")) {
    ipAddr = ipAddr.substring(7);
  }
  const ipCountry = getIpCountry(ipAddr);
  return (
    EU_COUNTRIES.has(ipCountry) ||
    ipCountry === "US" ||
    ipCountry === "Atlantis"
  );
}
