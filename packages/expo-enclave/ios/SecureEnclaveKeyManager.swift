import CryptoKit
import LocalAuthentication

public class SecureEnclaveKeyManager : KeyManager {
    let store = GenericPasswordStore()

    internal func createContext(usage: String, duration: TimeInterval) -> LAContext {
        let context = LAContext()
        context.touchIDAuthenticationAllowableReuseDuration = duration
        context.localizedReason = usage
        return context
    }

    internal func getSigningPrivkeyWithContext(accountName: String, usage: String, duration: TimeInterval = 0) throws -> SecureEnclave.P256.Signing.PrivateKey {
        let readSigningPrivkey: SecureEnclave.P256.Signing.PrivateKey? = try self.store.readKey(account: accountName)
        guard let signingPrivkey = readSigningPrivkey else {
            throw KeyStoreError("Unable to read account private key")
        }

        let context = createContext(usage: usage, duration: duration)
        let key = try SecureEnclave.P256.Signing.PrivateKey(dataRepresentation: signingPrivkey.dataRepresentation, authenticationContext: context)
        return key
    }

    internal func createSigningPrivkey(accountName: String) throws {
        var accessError: SecurityError?
        let accessControl = SecAccessControlCreateWithFlags(
            kCFAllocatorDefault,
            kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
            [.privateKeyUsage, .userPresence],
            &accessError
        )!

        if let error = accessError {
            throw error.takeRetainedValue() as Error
        }
        
        let signingPrivkey = try SecureEnclave.P256.Signing.PrivateKey(accessControl: accessControl)
        
        try self.store.storeKey(signingPrivkey, account: accountName)
    }

    public func fetchPublicKey(accountName: String) throws -> String? {
        let readSigningPrivkey: SecureEnclave.P256.Signing.PrivateKey? = try self.store.readKey(account: accountName)
        if readSigningPrivkey == nil {
            return nil
        }
        let signingPrivkey = readSigningPrivkey!
        return signingPrivkey.publicKey.rawRepresentation.hexEncodedString()
    }

    public func createKeyPair(accountName: String) throws -> String {
        try createSigningPrivkey(accountName: accountName)
        let signingPrivkey = try getSigningPrivkeyWithContext(accountName: accountName, usage: "Create key pair" + accountName)
        return signingPrivkey.publicKey.rawRepresentation.hexEncodedString()
    }

    public func sign(accountName: String, hexMessage: String) throws -> String {
        let message = Data(fromHexEncodedString: hexMessage)!
        let key = try getSigningPrivkeyWithContext(accountName: accountName, usage: "Sign Daimo tx " + hexMessage)
        let signature = try key.signature(for: message)
        return signature.rawRepresentation.hexEncodedString()
    }

    public func verify(accountName: String, hexSignature: String, hexMessage: String) throws -> Bool {
        let message = Data(fromHexEncodedString: hexMessage)!
        let signature = try P256.Signing.ECDSASignature(rawRepresentation: Data(fromHexEncodedString: hexSignature)!)
        let privKey = try getSigningPrivkeyWithContext(accountName: accountName, usage: "Verify Daimo tx " + hexMessage)
        return privKey.publicKey.isValidSignature(signature, for: message)
    }
}