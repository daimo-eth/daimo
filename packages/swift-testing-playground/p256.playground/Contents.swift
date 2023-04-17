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
}

let greeting = "Hello, playground"
let data = greeting.data(using: .utf8)!
print("data", data.hexEncodedString())

let privKey = try! SecureEnclave.P256.Signing.PrivateKey()
print("pubkey", privKey.publicKey.compactRepresentation!.hexEncodedString())
print("pk", privKey)
print("pkrep", privKey.dataRepresentation.hexEncodedString())

let signature = try privKey.signature(for: data)
print("sig", signature.rawRepresentation.hexEncodedString())

