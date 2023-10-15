import ExpoModulesCore

public class ExpoPasskeysModule: Module {
  let passkeyManager = PasskeyManager(domain: "funny-froyo-3f9b75.netlify.app")


  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  public func definition() -> ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ExpoPasskeys')` in JavaScript.
    Name("ExpoPasskeys")

    AsyncFunction("createPasskey") { (accountName: String, challengeBase64: String, promise: Promise) in
      self.passkeyManager.createPasskey(accountName: accountName, challengeBase64: challengeBase64, promise: promise)
    }

    AsyncFunction("signWithPasskey") { (challengeBase64: String, promise: Promise) in
      self.passkeyManager.signWithPasskey(challengeBase64: challengeBase64, promise: promise)
    }
  }
}
