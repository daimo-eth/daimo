//
//  KeyManager.swift
//  Daimo
//
//  Created by Nalin Bhardwaj.
//  Copyright © 2023 Daimo. All rights reserved.
//
//  The common protocol for key management (creation, sign, verify, fetch etc.).

protocol KeyManager {
    func fetchPublicKey(accountName: String) throws -> String?
    func createKeyPair(accountName: String) throws -> String
    func deleteKeyPair(accountName: String) throws
    func sign(accountName: String, hexMessage: String, usageMessage: String) throws -> String
    func verify(accountName: String, hexSignature: String, hexMessage: String) throws -> Bool
}