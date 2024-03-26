import ExpoModulesCore

public class ExpoPasskeysModule: Module {
  let passkeyManager = PasskeyManager()

  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  public func definition() -> ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ExpoPasskeys')` in JavaScript.
    Name("ExpoPasskeys")

    AsyncFunction("createPasskey") { (domain: String, accountName: String, userIdBase64: String, challengeBase64: String, useSecurityKey: Bool, promise: Promise) in
      self.passkeyManager.createKey(domain: domain, accountName: accountName, userIdBase64: userIdBase64, challengeBase64: challengeBase64, useSecurityKey: useSecurityKey, promise: promise)
    }

    AsyncFunction("signWithPasskey") { (domain: String, challengeBase64: String, useSecurityKey: Bool, promise: Promise) in
      self.passkeyManager.signWithKey(domain: domain, challengeBase64: challengeBase64, useSecurityKey: useSecurityKey, promise: promise)
    }
  }
}
