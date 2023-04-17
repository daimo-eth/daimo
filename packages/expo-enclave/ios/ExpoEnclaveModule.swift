import ExpoModulesCore
import CryptoKit

public class ExpoEnclaveModule: Module {
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  public func definition() -> ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ExpoEnclave')` in JavaScript.
    Name("ExpoEnclave")

    // Sets constant properties on the module. Can take a dictionary or a closure that returns a dictionary.
    Constants([
      "PI": Double.pi
    ])

    // Defines event names that the module can send to JavaScript.
    Events("onChange")

    // Defines a JavaScript synchronous function that runs the native code on the JavaScript thread.
    Function("hello") { () -> String in
      let pk = P256.Signing.PrivateKey()
      return pk.dataRepresentation.base64EncodedString()
    }

    // Defines a JavaScript function that always returns a Promise and whose native code
    // is by default dispatched on the different thread than the JavaScript runtime runs on.
    AsyncFunction("setValueAsync") { (value: String) in
      // Send an event to JavaScript.
      self.sendEvent("onChange", [
        "value": value
      ])
    }
  }
}

/// Generates a SecureEnclave P256 key, then saves a (reference to) it to the
/// keychain
func generateAndSaveKey(account: String) throws -> SecureEnclave.P256.Signing.PrivateKey {
    let key = SecureEnclave.P256.Signing.PrivateKey()
    try saveKey(key, account: account)
    return key
}


/// Reads a CryptoKit key from the keychain as a generic password.
func readKey(account: String) throws -> SecureEnclave.P256.Signing.PrivateKey? {

    // Seek a generic password with the given account.
    let query = [
        kSecClass: kSecClassGenericPassword,
        kSecAttrAccount: KEYCHAIN_STORE_PREFIX + account,
        kSecUseDataProtectionKeychain: true,
        kSecReturnData: true
    ] as [String: Any]
    
    // Find and cast the result as data.
    var item: CFTypeRef?
    switch SecItemCopyMatching(query as CFDictionary, &item) {
    case errSecSuccess:
        guard let data = item as? Data else { return nil }
        return try SecureEnclave.P256.PrivateKey(rawRepresentation: data)
    case errSecItemNotFound: return nil
    case let status: throw KeyStoreError("Keychain read failed: \(status.message)")
    }
}