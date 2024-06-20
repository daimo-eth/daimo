import { PlatformType } from "@daimo/common";
import { p256 } from "@noble/curves/p256";
import { base64nopad, base64urlnopad } from "@scure/base";
import { Address, getAddress } from "viem";

import { chainConfig, getEnvApi } from "../env";

export class BinanceClient {
  private readonly BIPAY_API_ROOT = "https://www.binance.com/bapi/pay";
  private readonly PRIVATE_KEY;

  constructor() {
    console.log(`[BINANCE] initializing`);
    this.PRIVATE_KEY = getEnvApi().BINANCE_API_PRIVATE_KEY;
    if (!this.PRIVATE_KEY) {
      console.log(`[BINANCE] no private key`);
    } else {
      console.log(`[BINANCE] verifying API availability`);
      this.verifyBinanceAvailability();
    }
  }

  private generateNonce() {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 32; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters[randomIndex];
    }
    return result;
  }

  private async signPayload(payload: string) {
    if (!this.PRIVATE_KEY) return undefined;

    const payloadBytes = Buffer.from(payload);
    const signature = p256.sign(payloadBytes, this.PRIVATE_KEY.slice(2), {
      prehash: true,
    });
    const sigBytes = signature.normalizeS().toDERRawBytes();
    const ret = base64urlnopad.encode(sigBytes);
    return ret;
  }

  private async signRequest(timestamp: string, nonce: string, body: string) {
    const payload = timestamp + "\n" + nonce + "\n" + body + "\n";
    return this.signPayload(payload);
  }

  private async signDeeplink(
    nonce: string,
    timestamp: string,
    transactionId: string
  ) {
    const payload = `nonce=${nonce}&timestamp=${timestamp}&transactionId=${transactionId}`;
    return this.signPayload(payload);
  }

  private async queryBinanceAPI<T>(
    path: string,
    body: Record<string, string>
  ): Promise<T | undefined> {
    const bodyStr = JSON.stringify({ source: "daimo", ...body }); // Add source

    const timestamp = Date.now().toString();
    const nonce = this.generateNonce();
    const sig = await this.signRequest(timestamp, nonce, bodyStr);
    if (!sig) return undefined;

    const headers = {
      "Content-Type": "application/json",
      "BinancePay-Timestamp": timestamp,
      "BinancePay-Nonce": nonce,
      "BinancePay-Signature": sig,
    };
    const url = `${this.BIPAY_API_ROOT}${path}`;

    const headersStr = JSON.stringify(headers);
    console.log(
      `[BINANCE] POSTing ${url}:\nbody: ${bodyStr}\nheaders: ${headersStr}`
    );

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: bodyStr,
    });
    const resBody = (await res.json()) as { data: T; success: boolean };
    if (res.status !== 200 || !resBody.success) {
      console.error(
        `[BINANCE] API error: ${res.status} ${JSON.stringify(resBody)}`
      );
      return undefined;
    }
    return resBody.data;
  }

  private async verifyBinanceAvailability() {
    const path = "/v1/friendly/binance-pay/withdraw/networks";

    const res = await this.queryBinanceAPI<{
      coinDetail: {
        coin: string;
        netWorkDetailList: {
          network: string;
          withdrawEnable: boolean;
          contractAddress: Address;
        }[];
      }[];
    }>(path, {});
    if (!res) throw new Error("Binance API not available");

    const usdc = res.coinDetail.find((c) => c.coin === "USDC");
    if (!usdc) throw new Error("USDC not supported");
    const base = usdc.netWorkDetailList.find((n) => n.network === "BASE");
    if (!base) throw new Error("Base not supported");
    if (!base.withdrawEnable) {
      throw new Error("Base USDC not withdrawable");
    }
    if (getAddress(base.contractAddress) !== chainConfig.tokenAddress) {
      throw new Error(
        `Wrong contract: ${base.contractAddress}, not ${chainConfig.tokenAddress}`
      );
    }
  }

  async createWithdrawalURL(addr: Address, platform: PlatformType) {
    const path = "/v1/friendly/binance-pay/withdraw/pre-create";
    const redirectUrl = "https://daimo.com/l/deposit";

    const res = await this.queryBinanceAPI<{
      transactionId: string;
      universalLinkUrl: string;
    }>(path, {
      currency: "USDC",
      network: "BASE",
      address: addr,
    });

    if (!res) return undefined;

    const { transactionId, universalLinkUrl } = res;

    const timestamp = Date.now().toString();
    const nonce = this.generateNonce();
    const sig = await this.signDeeplink(nonce, timestamp, transactionId);
    if (!sig) return undefined;

    if (platform === "ios") {
      const deeplinkUrl = `bnc://app.binance.com/payment/onchainpay?transactionId=${transactionId}&nonce=${nonce}&timeStamp=${timestamp}&sign=${sig}&redirectUrl=${redirectUrl}`;
      console.log(`[BINANCE] created deeplink: ${deeplinkUrl}`);
      const encodedDeeplinkUrl = base64urlnopad.encode(
        Buffer.from(deeplinkUrl)
      );
      return `${universalLinkUrl}?_dp=${encodedDeeplinkUrl}`;
    } else if (platform === "android") {
      const deeplinkUrl = `bnc://app.binance.com/payment/secpay?extra_key_api_type=on-chain-transfer&transactionId=${transactionId}&nonce=${nonce}&sign=${sig}&timeStamp=${timestamp}&redirectUrl=${redirectUrl}`;
      console.log(`[BINANCE] created deeplink: ${deeplinkUrl}`);
      const encodedDeeplinkUrl = base64nopad.encode(Buffer.from(deeplinkUrl));
      return `${universalLinkUrl}?_dp=${encodedDeeplinkUrl}`;
    } else return undefined;
  }
}
