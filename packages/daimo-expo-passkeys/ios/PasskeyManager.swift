//
//  PasskeyManager.swift
//  Daimo
//
//  Created by Nalin Bhardwaj.
//  Copyright © 2023 Daimo. All rights reserved.
//
//  PasskeyManager is our interface to the Passkey and Security Key APIs.

import AuthenticationServices
import ExpoModulesCore

public class PasskeyManager {
    public func createKey(domain: String, accountName: String, userIdBase64: String, challengeBase64: String, useSecurityKey: Bool, promise: Promise) {
        let challenge = Data(base64Encoded: challengeBase64)!
        let userId = Data(base64Encoded: userIdBase64)!

        let controller: ASAuthorizationController

        if useSecurityKey {
            let provider = ASAuthorizationSecurityKeyPublicKeyCredentialProvider(relyingPartyIdentifier: domain)
            let registrationRequest = provider.createCredentialRegistrationRequest(challenge: challenge, displayName: accountName, name: accountName, userID: userId)
            registrationRequest.credentialParameters = [ ASAuthorizationPublicKeyCredentialParameters(algorithm: ASCOSEAlgorithmIdentifier.ES256) ]

            controller = ASAuthorizationController(authorizationRequests: [registrationRequest])
        } else {
            let provider = ASAuthorizationPlatformPublicKeyCredentialProvider(relyingPartyIdentifier: domain)
            let registrationRequest = provider.createCredentialRegistrationRequest(challenge: challenge, name: accountName, userID: userId)

            controller = ASAuthorizationController(authorizationRequests: [registrationRequest])
        }

        AuthResponder().performAuth(controller: controller, callback: { (response, error) in
            if let error = error {
                promise.reject("AuthError", interpretAuthError(error))
                return
            }

            guard let response = response else {
                promise.reject("UnknownError", "No response or error")
                return
            }

            switch response.credential {
                case let credential as ASAuthorizationPublicKeyCredentialRegistration:
                    let response: [AnyHashable: Any] = [
                        "rawClientDataJSON": credential.rawClientDataJSON.base64EncodedString(),
                        "rawAttestationObject": credential.rawAttestationObject?.base64EncodedString()
                    ]

                    promise.resolve(response)
                default:
                    promise.reject("UnknownError", "Unexpected credential type: \(response.credential)")
            }
        })
    }

    public func signWithKey(domain: String, challengeBase64: String, useSecurityKey: Bool, promise: Promise) {
        let challenge = Data(base64Encoded: challengeBase64)!

        let assertionRequest: ASAuthorizationRequest

        if useSecurityKey {
            let provider = ASAuthorizationSecurityKeyPublicKeyCredentialProvider(relyingPartyIdentifier: domain)
            assertionRequest = provider.createCredentialAssertionRequest(challenge: challenge)
        } else {
            let provider = ASAuthorizationPlatformPublicKeyCredentialProvider(relyingPartyIdentifier: domain)
            assertionRequest = provider.createCredentialAssertionRequest(challenge: challenge)
        }

        let controller = ASAuthorizationController(authorizationRequests: [assertionRequest])

        AuthResponder().performAuth(controller: controller, callback: { (response, error) in
            if let error = error {
                promise.reject("AuthError", interpretAuthError(error))
                return
            }

            guard let response = response else {
                promise.reject("UnknownError", "No response or error")
                return
            }

            switch response.credential {
                case let credential as ASAuthorizationPublicKeyCredentialAssertion:
                    let response: [AnyHashable: Any] = [
                        "userID": credential.userID.base64EncodedString(),
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