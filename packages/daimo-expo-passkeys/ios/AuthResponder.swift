//
//  AuthResponder.swift
//  Daimo
//
//  Created by Nalin Bhardwaj.
//  Copyright © 2023 Daimo. All rights reserved.
//
//  AuthResponder is the delegate that receives the result of a Passkey or 
//  SecurityKey creation/sign request and passes it back to the callback 
//  for processing.

import AuthenticationServices
import ExpoModulesCore

typealias AuthenticationRequestCallback = (ASAuthorization?, Error?) -> Void

// A set used to retain pending requests until their callback is called
var pendingRequests = Set<AuthResponder>()

class AuthResponder: NSObject, ASAuthorizationControllerPresentationContextProviding, ASAuthorizationControllerDelegate {
    private var callback: AuthenticationRequestCallback?
    
    func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        guard let window = UIApplication.shared.keyWindow else {
            fatalError("Unable to present modal because UIApplication.shared.keyWindow is not available")
        }
        return window
    }

    func performAuth(controller: ASAuthorizationController, callback: @escaping AuthenticationRequestCallback) {
        self.callback = callback
        controller.delegate = self
        controller.presentationContextProvider = self
        pendingRequests.insert(self)

        controller.performRequests()
    }

    func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        self.callback!(authorization, nil)
        self.callback = nil
        pendingRequests.remove(self)
    }

    func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        self.callback!(nil, error)
        self.callback = nil
        pendingRequests.remove(self)
    }
}
