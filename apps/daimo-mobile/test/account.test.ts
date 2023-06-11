import { Account, parse, serialize } from "../src/logic/account";
import { assert } from "../src/logic/assert";
import { importKeypair } from "../src/logic/crypto";

const keypairJWK = `{"publicKey":{"key_ops":["verify"],"ext":true,"kty":"EC","x":"PQDLKmUDXezZH6ph8_4Hs3TGj6HkzjhALsvENzNNSOY","y":"VXe-awxy0lkyA8LJ5xTlmCV4ofjQXuNyQSZdrAfteMY","crv":"P-256"},"privateKey":{"key_ops":["sign"],"ext":true,"kty":"EC","x":"PQDLKmUDXezZH6ph8_4Hs3TGj6HkzjhALsvENzNNSOY","y":"VXe-awxy0lkyA8LJ5xTlmCV4ofjQXuNyQSZdrAfteMY","crv":"P-256","d":"ileqoElhqRTQLbGtS92QFKUV243UMA5PsecR2B3P6yg"}}`;
const keypairPromise = importKeypair(keypairJWK);
const correctSer = `{"storageVersion":1,"name":"test","address":"0x123","lastBalance":"123","lastNonce":"456","lastBlockTimestamp":789,"signingKeyJWK":${JSON.stringify(
  keypairJWK
)}}`;

describe("Account", () => {
  it("serializes", async () => {
    const a: Account = {
      name: "test",
      address: "0x123",
      lastBalance: BigInt(123),
      lastNonce: BigInt(456),
      lastBlockTimestamp: 789,
      keypair: keypairPromise,
    };
    const ser = await serialize(a);
    expect(ser).toEqual(correctSer);
  });

  it("deserializes", () => {
    const a = parse(correctSer);
    assert(a != null);
    const { name, address, lastBalance, lastNonce, lastBlockTimestamp } = a;
    expect({
      name,
      address,
      lastBalance,
      lastNonce,
      lastBlockTimestamp,
    }).toEqual({
      name: "test",
      address: "0x123",
      lastBalance: BigInt(123),
      lastNonce: BigInt(456),
      lastBlockTimestamp: 789,
    });
  });
});
