package expo.modules.enclave

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import android.content.Context
import expo.modules.core.interfaces.ExpoMethod
import expo.modules.core.ModuleRegistry
import expo.modules.core.ExportedModule
import expo.modules.core.Promise

class ExpoEnclaveModule(context: Context) : ExportedModule(context) {
  lateinit var moduleRegistry: ModuleRegistry
  lateinit var keyManager: KeyManager

  override fun onCreate(_moduleRegistry: ModuleRegistry) {
    moduleRegistry = _moduleRegistry
    keyManager = KeyManager(context, moduleRegistry)
  }

  override fun getName() = "ExpoEnclave"

  @ExpoMethod
  fun isSecureEnclaveAvailable(promise: Promise) {
    promise.resolve(keyManager.isSecureEnclaveAvailable())
  }

  @ExpoMethod
  fun fetchPublicKey(accountName: String, promise: Promise) {
    promise.resolve(keyManager.fetchPublicKey(accountName))
  }

  @ExpoMethod
  fun createKeyPair(accountName: String, promise: Promise) {
    promise.resolve(keyManager.createKeyPair(accountName))
  }

  @ExpoMethod
  fun sign(accountName: String, message: String, promise: Promise) {
    keyManager.sign(accountName, message, promise)
  }

  @ExpoMethod
  fun verify(accountName: String, signature: String, message: String, promise: Promise) {
    promise.resolve(keyManager.verify(accountName, signature, message))
  }
}