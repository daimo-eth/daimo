//
//  PasskeyManager.swift
//  Daimo
//
//  Created by Nalin Bhardwaj.
//  Copyright © 2023 Daimo. All rights reserved.
//
//  PasskeyManager is our interface to the Passkeys APIs.

import AuthenticationServices
import ExpoModulesCore

public class PasskeyManager {
    let provider: ASAuthorizationPlatformPublicKeyCredentialProvider

    public init(domain: String) {
        self.provider = ASAuthorizationPlatformPublicKeyCredentialProvider(relyingPartyIdentifier: domain)
    }

    internal func interpretError(_ error: Error) -> String {
        guard let authError = error as? ASAuthorizationError else {
            return "Unexpected auth error: \(error.localizedDescription)"
        }

        if authError.code == .canceled {
            return "User canceled auth request"
        } else {
            // The userInfo dictionary sometimes contains useful information.
            return "Error: \((error as NSError).userInfo)"
        }
    }

    public func createPasskey(accountName: String, challengeBase64: String, promise: Promise) {
        let challenge = Data(base64Encoded: challengeBase64)!
        let userId = accountName.data(using: .utf8)!

        let registrationRequest = self.provider.createCredentialRegistrationRequest(challenge: challenge, name: accountName, userID: userId)
        let controller = ASAuthorizationController(authorizationRequests: [registrationRequest])

        PasskeyResponse().performAuth(controller: controller, callback: { (response, error) in
            if let error = error {
                promise.reject("AuthError", self.interpretError(error))
                return
            }

            guard let response = response else {
                promise.reject("UnknownError", "No response or error")
                return
            }

            switch response.credential {
                case let credential as ASAuthorizationPlatformPublicKeyCredentialRegistration:
                    let response: [AnyHashable: Any] = [
                        "credentialID": credential.credentialID.base64EncodedString(),
                        "rawClientDataJSON": credential.rawClientDataJSON.base64EncodedString(),
                        "rawAttestationObject": credential.rawAttestationObject?.base64EncodedString()
                    ]

                    promise.resolve(response)
                default:
                    promise.reject("UnknownError", "Unexpected credential type: \(response.credential)")
            }
        })
    }

    public func signWithPasskey(challengeBase64: String, promise: Promise) {
        let challenge = Data(base64Encoded: challengeBase64)!

        let assertionRequest = self.provider.createCredentialAssertionRequest(challenge: challenge)
        let controller = ASAuthorizationController(authorizationRequests: [assertionRequest])

        PasskeyResponse().performAuth(controller: controller, callback: { (response, error) in
            if let error = error {
                promise.reject("AuthError", self.interpretError(error))
                return
            }

            guard let response = response else {
                promise.reject("UnknownError", "No response or error")
                return
            }

            switch response.credential {
                case let credential as ASAuthorizationPlatformPublicKeyCredentialAssertion:
                    let response: [AnyHashable: Any] = [
                        "credentialID": credential.credentialID.base64EncodedString(),
                        "userID": String(data: credential.userID, encoding: .utf8)!,
                        "signature": credential.signature.base64EncodedString(),
                        "rawClientDataJSON": credential.rawClientDataJSON.base64EncodedString(),
                        "rawAuthenticatorData": credential.rawAuthenticatorData.base64EncodedString()
                    ]

                    promise.resolve(response)
                default:
                    promise.reject("UnknownError", "Unexpected credential type: \(response.credential)")
            }
        })
    }
}