import { parsePaymentUri } from "../src/logic/paymentURI";

describe("Payment URI", () => {
  // https://github.com/daimo-eth/daimo/issues/1356
  it("Parses Bitrefill URI", () => {
    const uri = parsePaymentUri(
      `ethereum:0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359@137/transfer?address=0xaCB6230043d1Fc3dE02a43Aa748540bb9F260931&uint256=1e8`
    );

    expect(uri.recipientAddress).toEqual(
      "0xaCB6230043d1Fc3dE02a43Aa748540bb9F260931"
    );
    expect(uri.amount).toEqual("100000000");
  });
});
