//
//  KeyManager.swift
//  Daimo
//
//  Created by Nalin Bhardwaj.
//  Copyright © 2023 Daimo. All rights reserved.
//
//  The common protocol for key management (creation, sign, verify, fetch etc.).

typealias SecurityError = Unmanaged<CFError>

protocol KeyManager {
    func fetchPublicKey(accountName: String) throws -> String?
    func createKeyPair(accountName: String) throws -> String
    func sign(accountName: String, hexMessage: String) throws -> String
    func verify(accountName: String, hexSignature: String, hexMessage: String) throws -> Bool
}