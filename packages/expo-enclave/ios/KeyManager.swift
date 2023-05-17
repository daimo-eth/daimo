import CryptoKit
import LocalAuthentication

typealias SecurityError = Unmanaged<CFError>

protocol KeyManager {
    func fetchPublicKey(accountName: String) throws -> String?
    func createKeyPair(accountName: String) throws -> String
    func sign(accountName: String, hexMessage: String) throws -> String
    func verify(accountName: String, hexSignature: String, hexMessage: String) throws -> Bool
}