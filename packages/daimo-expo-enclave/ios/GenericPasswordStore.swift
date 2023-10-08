//
//  GenericPasswordStore.swift
//  Daimo
//
//  Created by Nalin Bhardwaj.
//  Copyright © 2022 Daimo. All rights reserved.
//
//  Methods for storing generic password convertible items in the keychain.

import Foundation
import CryptoKit
import Security

let KEYCHAIN_STORE_PREFIX = "com.daimo."

struct GenericPasswordStore {
    /// Stores a CryptoKit key in the keychain as a generic password.
    func storeKey<T: GenericPasswordConvertible>(_ key: T, account: String, requireUserPresence: Bool) throws {
        var accessError: SecurityError?
        let accessControl = SecAccessControlCreateWithFlags(
            kCFAllocatorDefault,
            kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
            requireUserPresence ? [.userPresence] : [],
            &accessError
        )!

        if let error = accessError {
            throw error.takeRetainedValue() as Error
        }

        // Treat the key data as a generic password.
        let query = [kSecClass: kSecClassGenericPassword,
                     kSecAttrAccount: KEYCHAIN_STORE_PREFIX + account,
                     kSecAttrAccessControl: accessControl,
                     kSecUseDataProtectionKeychain: true,
                     kSecValueData: key.rawRepresentation] as [String: Any]
        
        // Add the key data.
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw KeyStoreError("Unable to store item: \(status.message)")
        }
    }
    
    /// Reads a CryptoKit key from the keychain as a generic password.
    func readKey<T: GenericPasswordConvertible>(account: String) throws -> T? {

        // Seek a generic password with the given account.
        let query = [kSecClass: kSecClassGenericPassword,
                     kSecAttrAccount: KEYCHAIN_STORE_PREFIX + account,
                     kSecUseDataProtectionKeychain: true,
                     kSecReturnData: true] as [String: Any]
        
        // Find and cast the result as data.
        var item: CFTypeRef?
        switch SecItemCopyMatching(query as CFDictionary, &item) {
        case errSecSuccess:
            guard let data = item as? Data else { return nil }
            return try T(rawRepresentation: data)  // Convert back to a key.
        case errSecItemNotFound: return nil
        case let status:
            throw KeyStoreError("Keychain read failed: \(status.message)")
        }
    }
    
    /// [Test] Stores a key in the keychain and then reads it back.
    // TODO: Add a test file for this.
    func roundTripTest<T: GenericPasswordConvertible>(_ key: T) throws -> T {
        
        // An account name for the key in the keychain.
        let account = "com.example.genericpassword.key"
        
        // Start fresh.
        try deleteKey(account: account)
        
        // Store and read it back.
        try storeKey(key, account: account, requireUserPresence: false)
        guard let key: T = try readKey(account: account) else {
            throw KeyStoreError("Failed to locate stored key.")
        }
        return key
    }
    
    /// Removes any existing key with the given account.
    func deleteKey(account: String) throws {
        let query = [kSecClass: kSecClassGenericPassword,
                     kSecUseDataProtectionKeychain: true,
                     kSecAttrAccount: KEYCHAIN_STORE_PREFIX + account] as [String: Any]
        switch SecItemDelete(query as CFDictionary) {
        case errSecItemNotFound, errSecSuccess: break // Okay to ignore
        case let status:
            throw KeyStoreError("Unexpected deletion error: \(status.message)")
        }
    }
}