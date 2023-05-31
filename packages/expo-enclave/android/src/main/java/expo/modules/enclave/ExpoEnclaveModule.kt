package expo.modules.enclave

import android.content.Context
import expo.modules.core.interfaces.ExpoMethod
import expo.modules.core.ModuleRegistry
import expo.modules.core.ExportedModule
import expo.modules.core.Promise

// Note that this is a ExportedModule, not a Module as expo recommends.
// This is because we need access to the application context to be able
// to inject a BiometricPrompt instance. As far as I can tell, using a
// ExportedModule is the only way to do this, as seen in the official 
// [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/)
// and [expo-sensors](https://docs.expo.dev/versions/latest/sdk/sensors/) packages.
// Unfortunately, ExportedModule is not documented well, so much of the
// design of this module is modeled after those two packages.
class ExpoEnclaveModule(context: Context) : ExportedModule(context) {
  lateinit var moduleRegistry: ModuleRegistry
  lateinit var keyManager: KeyManager

  override fun onCreate(_moduleRegistry: ModuleRegistry) {
    moduleRegistry = _moduleRegistry
    keyManager = KeyManager(context, moduleRegistry)
  }

  override fun getName() = "ExpoEnclave"

  internal fun hasStrongbox(): Boolean {
    return Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
      && context.packageManager.hasSystemFeature(PackageManager.FEATURE_STRONGBOX_KEYSTORE)
  }

  internal fun hasBiometrics(): Boolean {
    val biometricManager = BiometricManager.from(context)
    return biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.DEVICE_CREDENTIAL) == BiometricManager.BIOMETRIC_SUCCESS
  }


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