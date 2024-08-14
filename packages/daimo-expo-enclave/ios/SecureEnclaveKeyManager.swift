//
//  SecureEnclaveKeyManager.swift
//  Daimo
//
//  Created by Nalin Bhardwaj.
//  Copyright © 2023 Daimo. All rights reserved.
//
//  SecureEnclaveKeyManager is our interface to the Secure Enclave.
//  It creates keypairs which will never leave the enclave
//  and lets you sign and verify messages with them.

import CryptoKit
import LocalAuthentication

public class SecureEnclaveKeyManager : KeyManager {
    let store = GenericPasswordStore()

    internal func createContext(usage: String?, duration: TimeInterval) -> LAContext {
        let context = LAContext()
        context.touchIDAuthenticationAllowableReuseDuration = duration
        context.localizedReason = usage ?? "Unexpected usage"
        return context
    }

    internal func getSigningPrivkeyWithContext(accountName: String, usage: String?, duration: TimeInterval = 0) throws -> SecureEnclave.P256.Signing.PrivateKey {
        let readSigningPrivkey: SecureEnclave.P256.Signing.PrivateKey? = try self.store.readKey(account: accountName)
        
        /** signingPrivKey is an opaque object that represents the actual private key inside the enclave */
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
        
        // Since the key is authed by the enclave and the keychain only stores an encrypted blob
        // representation, we do not auth userPresence for keychain reads. Additionally, it would
        // be bad UX to prompt the user for presence/auth twice (separately for keychain reads and
        // on Secure Enclave signing).
        try self.store.storeKey(signingPrivkey, account: accountName, requireUserPresence: false)
    }

    public func fetchPublicKey(accountName: String) throws -> String? {
        let readSigningPrivkey: SecureEnclave.P256.Signing.PrivateKey? = try self.store.readKey(account: accountName)
        guard let signingPrivkey = readSigningPrivkey else {
            return nil
        }
        return signingPrivkey.publicKey.derRepresentation.hexEncodedString()
    }

    public func createKeyPair(accountName: String) throws -> String {
        try createSigningPrivkey(accountName: accountName)
        let signingPrivkey = try getSigningPrivkeyWithContext(accountName: accountName, usage: nil)
        return signingPrivkey.publicKey.derRepresentation.hexEncodedString()
    }

    public func deleteKeyPair(accountName: String) throws {
        try self.store.deleteKey(account: accountName)
    }

    public func sign(accountName: String, hexMessage: String, usageMessage: String) throws -> String {
        let message = Data(fromHexEncodedString: hexMessage)!
        let key = try getSigningPrivkeyWithContext(accountName: accountName, usage: usageMessage)
        let signature = try key.signature(for: message)
        return signature.derRepresentation.hexEncodedString()
    }

    public func verify(accountName: String, hexSignature: String, hexMessage: String) throws -> Bool {
        let message = Data(fromHexEncodedString: hexMessage)!
        let signature = try P256.Signing.ECDSASignature(derRepresentation: Data(fromHexEncodedString: hexSignature)!)
        let privKey = try getSigningPrivkeyWithContext(accountName: accountName, usage: nil)
        return privKey.publicKey.isValidSignature(signature, for: message)
    }
}