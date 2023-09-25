//
//  FallbackKeyManager.swift
//  Daimo
//
//  Created by Nalin Bhardwaj.
//  Copyright © 2023 Daimo. All rights reserved.
//
//  FallbackKeyManager is our interface to in-memory keys.
//  It creates private keys which are stored in the keychain but 
//  processed in memory for signing and verifying messages.
//
// TODO: key lives in keychain. How do we make sure other apps can't access?
// TODO: show system auth prompt when signing

import CryptoKit
import LocalAuthentication

public class FallbackKeyManager : KeyManager {
    let store = GenericPasswordStore()

    internal func createSigningPrivkey(accountName: String) throws {
        let signingPrivkey = P256.Signing.PrivateKey()
        
        try self.store.storeKey(signingPrivkey, account: accountName, requireUserPresence: true)
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
        guard let signingPrivkey = readSigningPrivkey else {
            return nil
        }
        return signingPrivkey.publicKey.derRepresentation.hexEncodedString()
    }

    public func createKeyPair(accountName: String) throws -> String {
        try createSigningPrivkey(accountName: accountName)
        let signingPrivkey = try getSigningPrivkey(accountName: accountName)
        return signingPrivkey.publicKey.derRepresentation.hexEncodedString()
    }

    public func deleteKeyPair(accountName: String) throws {
        try self.store.deleteKey(account: accountName)
    }

    public func sign(accountName: String, hexMessage: String, usageMessage: String) throws -> String {
        let message = Data(fromHexEncodedString: hexMessage)!
        let key = try getSigningPrivkey(accountName: accountName)
        let signature = try key.signature(for: message)
        return signature.derRepresentation.hexEncodedString()
    }

    public func verify(accountName: String, hexSignature: String, hexMessage: String) throws -> Bool {
        let message = Data(fromHexEncodedString: hexMessage)!
        let signature = try P256.Signing.ECDSASignature(derRepresentation: Data(fromHexEncodedString: hexSignature)!)
        let privKey = try getSigningPrivkey(accountName: accountName)
        return privKey.publicKey.isValidSignature(signature, for: message)
    }
}