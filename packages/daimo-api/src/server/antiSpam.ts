import { getEnvApi } from "../env";
import { fetchWithBackoff } from "../network/fetchWithBackoff";

// Faucet anti-spam API
export class AntiSpam {
  private static url = getEnvApi().DAIMO_FAUCET_API_URL;
  private static apiKey = getEnvApi().DAIMO_FAUCET_API_KEY;

  // Check whether a request is eligible for invite link faucet.
  public static async shouldSendFaucet(reqInfo: any): Promise<boolean> {
    // Staging = no faucet API = always allow
    if (AntiSpam.url === "") return true;

    // Prod = query API to avoid sending invite faucet to spammers / farmers
    const faucetUrl = new URL("/faucet", AntiSpam.url);
    const resp = await AntiSpam.tryQuery<{ sendFaucet: boolean }>(
      faucetUrl,
      reqInfo
    );
    const sendFaucet = !!resp?.sendFaucet;
    const sendFaucetStr = sendFaucet ? "allow" : "DENY";
    console.log(`[API] queried ${faucetUrl}: ${sendFaucetStr}`, reqInfo);

    return sendFaucet;
  }

  // Check whether a request can use the Daimo API at all.
  public static async shouldServeAPI(reqInfo: any): Promise<boolean> {
    // Staging = no faucet API = always allow
    if (AntiSpam.url === "") return true;

    const faucetUrl = new URL("/api-protection", AntiSpam.url);
    const resp = await AntiSpam.tryQuery<{ allowAPI: boolean }>(
      faucetUrl,
      reqInfo
    );
    return resp == null || resp.allowAPI;
  }

  private static async tryQuery<T>(url: URL, reqInfo: any): Promise<T | null> {
    const body = JSON.stringify(reqInfo);
    try {
      const faucetRes = await fetchWithBackoff(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": AntiSpam.apiKey,
        },
        body,
      });
      return (await faucetRes.json()) as T;
    } catch (e: any) {
      console.error(`[API] error querying faucet API`, url, body, e);
      return null;
    }
  }
}
