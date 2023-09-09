import Cocoa
import CryptoKit

extension Data {
    struct HexEncodingOptions: OptionSet {
        let rawValue: Int
        static let upperCase = HexEncodingOptions(rawValue: 1 << 0)
    }

    func hexEncodedString(options: HexEncodingOptions = []) -> String {
        let format = options.contains(.upperCase) ? "%02hhX" : "%02hhx"
        return self.map { String(format: format, $0) }.joined()
    }
    
    init?(fromHexEncodedString string: String) {

            // Convert 0 ... 9, a ... f, A ...F to their decimal value,
            // return nil for all other input characters
            func decodeNibble(u: UInt8) -> UInt8? {
                switch(u) {
                case 0x30 ... 0x39:
                    return u - 0x30
                case 0x41 ... 0x46:
                    return u - 0x41 + 10
                case 0x61 ... 0x66:
                    return u - 0x61 + 10
                default:
                    return nil
                }
            }

            self.init(capacity: string.utf8.count/2)
            
            var iter = string.utf8.makeIterator()
            while let c1 = iter.next() {
                guard
                    let val1 = decodeNibble(u: c1),
                    let c2 = iter.next(),
                    let val2 = decodeNibble(u: c2)
                else { return nil }
                self.append(val1 << 4 + val2)
            }
        }
}

let data = Data(fromHexEncodedString: "fae0417c547468482531aad9b9f6e8b6b9cccd9ede1d9f1088d28eb819512379")!
print("data", data.hexEncodedString())

let pemKeyString = "-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgzgqPr1Hne1iJ0M+5\nskB1cD+mDR5kM4C/potmFVHn46ihRANCAARlovpE2q1G6rAnhwPttsTc9eMLiprs\nCf3HGlb1KqOS5Ep6nkYEqjaJggmZcojpAqxUSlVeS14Knv7ytZIz8/Q3\n-----END PRIVATE KEY-----";

let privKey = try! P256.Signing.PrivateKey(pemRepresentation: pemKeyString)
print("pubkey", privKey.publicKey.derRepresentation.hexEncodedString())
print("pubkey extended", privKey.publicKey.rawRepresentation.hexEncodedString())
print("pk", privKey.pemRepresentation)
print("pkrep", privKey.rawRepresentation.hexEncodedString())

let emptiness: UInt8 = 0


let signature = try privKey.signature(for: data)
print("sig", signature.rawRepresentation.hexEncodedString())

let hexSignature = signature.rawRepresentation.hexEncodedString()
let sig = try P256.Signing.ECDSASignature(rawRepresentation: Data(fromHexEncodedString: hexSignature)!)

//  new account address: 0xFC89f5049A1eCdBB52487be461e3C2aA81bd84A5

let keyData = Data(fromHexEncodedString:  "3059301306072a8648ce3d020106082a8648ce3d030107034200041bf24cd1fa3d0d0a0f96c63b63af690ca0c171172fa08ad9a976c4a2be7421daa54f11ccb62cb1909ffff628bac5f83ada775db4ab4d1326ff9fbdb6cd76ca43")


// android testing, they're using DER sigh

let androidKey = try P256.Signing.PublicKey(derRepresentation: keyData!)

let messageData = Data(fromHexEncodedString: "deadbeef")!

let sigData = Data(fromHexEncodedString: "30440220780a20ec08d3a9dba95b997b35fdc2f6c1d9adc8f88638375cb534d1c6ec6127022068081890c15b6954c080837ff1dde3677f6af64fd3c4255a8e1d6a1f960c401f")!

print("androidKey rawrepr", androidKey.rawRepresentation.hexEncodedString())

print(androidKey.isValidSignature(try P256.Signing.ECDSASignature(derRepresentation: sigData), for: messageData))

let sigData2 = Data(fromHexEncodedString: "304502206510013effa6ba1c7670c4f3d4372cd46d00d257144579f8536ebb329c49b6f5022100adacdbc7f5472d3039488a7350d7db39cba04e3d520a3639d225cb8ecd2ad8c1")!
let sig2 = try P256.Signing.ECDSASignature(derRepresentation: sigData2)

print("sigdata", sig2.rawRepresentation.hexEncodedString())

let anotherKey = Data(fromHexEncodedString: "3059301306072a8648ce3d020106082a8648ce3d03010703420004fd0f9efcf440148115d805fce5ae1d4cf9f16e05128ed4b2fc0d3d1ce7fcfb4b40fbdb43428c7d3b1c067ded609c2e849fd4cfef406f06d0e0ae872e247e8d59")!

let mainKey = try P256.Signing.PublicKey(derRepresentation: anotherKey)
print("mainKey", mainKey.rawRepresentation.hexEncodedString())
