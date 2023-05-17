import CryptoKit
import LocalAuthentication

public class FallbackKeyManager : KeyManager {
    let store = GenericPasswordStore()

    internal func createSigningPrivkey(accountName: String) throws {
        let signingPrivkey = P256.Signing.PrivateKey()
        
        try self.store.storeKey(signingPrivkey, account: accountName)
    }

    internal func getSigningPrivkey(accountName: String) throws -> P256.Signing.PrivateKey {
        let signingPrivkey: P256.Signing.PrivateKey? = try self.store.readKey(account: accountName)
        if signingPrivkey == nil {
            throw KeyStoreError("Unable to read signing privkey for account " + accountName)
        }
        return signingPrivkey!
    }

    public func fetchPublicKey(accountName: String) throws -> String? {
        let readSigningPrivkey: P256.Signing.PrivateKey? = try self.store.readKey(account: accountName)
        if readSigningPrivkey == nil {
            return nil
        }
        let signingPrivkey = readSigningPrivkey!
        return signingPrivkey.publicKey.rawRepresentation.hexEncodedString()
    }

    public func createKeyPair(accountName: String) throws -> String {
        try createSigningPrivkey(accountName: accountName)
        let signingPrivkey = try getSigningPrivkey(accountName: accountName)
        return signingPrivkey.publicKey.rawRepresentation.hexEncodedString()
    }

    public func sign(accountName: String, hexMessage: String) throws -> String {
        let message = Data(fromHexEncodedString: hexMessage)!
        let key = try getSigningPrivkey(accountName: accountName)
        let signature = try key.signature(for: message)
        return signature.rawRepresentation.hexEncodedString()
    }

    public func verify(accountName: String, hexSignature: String, hexMessage: String) throws -> Bool {
        let message = Data(fromHexEncodedString: hexMessage)!
        let signature = try P256.Signing.ECDSASignature(rawRepresentation: Data(fromHexEncodedString: hexSignature)!)
        let privKey = try getSigningPrivkey(accountName: accountName)
        return privKey.publicKey.isValidSignature(signature, for: message)
    }
}