package expo.modules.enclave

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoEnclaveModule : Module() {
  val keyManager = KeyManager()
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  override fun definition() = ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ExpoEnclave')` in JavaScript.
    Name("ExpoEnclave")

    Function("isSecureEnclaveAvailable", this@ExpoEnclaveModule::isSecureEnclaveAvailable)
    Function("fetchPublicKey", this@ExpoEnclaveModule::fetchPublicKey)
    Function("createKeyPair", this@ExpoEnclaveModule::createKeyPair)
    Function("sign", this@ExpoEnclaveModule::sign)
    Function("verify", this@ExpoEnclaveModule::verify)
  }

  private fun isSecureEnclaveAvailable(): Boolean {
    return keyManager.isSecureEnclaveAvailable()
  }

  private fun fetchPublicKey(accountName: String): String? {
    return keyManager.fetchPublicKey(accountName)
  }

  private fun createKeyPair(accountName: String): String {
    return keyManager.createKeyPair(accountName)
  }

  private fun sign(accountName: String, message: String): String {
    return keyManager.sign(accountName, message)
  }

  private fun verify(accountName: String, message: String, signature: String): Boolean {
    return keyManager.verify(accountName, message, signature)
  }
}
