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

// hex version of '\x19Ethereum Signed Message:\n32'
let hexifiedPrefix = "19457468657265756d205369676e6564204d6573736167653a0a3332";
let data = Data(fromHexEncodedString: hexifiedPrefix + "bc8e1db45e18d9c05414af997d07148e99448585916cd64cad356dff8dcea225")!
print("data", data.hexEncodedString())

let pemKeyString = "-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgzgqPr1Hne1iJ0M+5\nskB1cD+mDR5kM4C/potmFVHn46ihRANCAARlovpE2q1G6rAnhwPttsTc9eMLiprs\nCf3HGlb1KqOS5Ep6nkYEqjaJggmZcojpAqxUSlVeS14Knv7ytZIz8/Q3\n-----END PRIVATE KEY-----";

let privKey = try! P256.Signing.PrivateKey(pemRepresentation: pemKeyString)
print("pubkey", privKey.publicKey.compactRepresentation!.hexEncodedString())
print("pubkey extended", privKey.publicKey.rawRepresentation.hexEncodedString())
print("pk", privKey.pemRepresentation)
//print("pkrep", privKey.dataRepresentation.hexEncodedString())

let emptiness: UInt8 = 0


let signature = try privKey.signature(for: data)
print("sig", signature.rawRepresentation.hexEncodedString())

//  new account address: 0xFC89f5049A1eCdBB52487be461e3C2aA81bd84A5
