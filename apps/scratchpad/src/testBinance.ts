import { BinanceClient } from "@daimo/api/src/network/binanceClient";

export function testBinanceDesc() {
  return `Test Binance Pay API integration.`;
}

export async function testBinance() {
  const bn = new BinanceClient();
  console.log(`[TEST] verifying API availability ${bn}`);
  const res = await bn.createWithdrawalURL(
    "0x27785Ad361898B526F37d87C4fAcFD757Ff0622F",
    "ios"
  );
  console.log(`[TEST] withdraw URL: ${res}`);
}
