package expo.modules.enclave

import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import expo.modules.core.interfaces.ExpoMethod
import expo.modules.core.ModuleRegistry
import expo.modules.core.ExportedModule
import expo.modules.core.Promise
import java.security.spec.ECGenParameterSpec
import java.security.KeyPairGenerator
import androidx.biometric.BiometricManager
import android.security.keystore.KeyInfo
import java.security.KeyFactory
import expo.modules.kotlin.types.Enumerable
import expo.modules.core.arguments.ReadableArguments

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
    if (hasBiometrics()) {
      keyManager = BiometricsKeyManager(context, moduleRegistry, hasStrongbox())
    } else {
      keyManager = FallbackKeyManager()
    }
  }

  override fun getName() = "ExpoEnclave"

  internal fun hasStrongbox(): Boolean {
    return Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
      && context.packageManager.hasSystemFeature(PackageManager.FEATURE_STRONGBOX_KEYSTORE)
  }

  internal fun hasTEE(): Boolean {
    // Create dummy key to test if TEE is available
    var generator = KeyGenParameterSpec.Builder("hasTEE_TEST_KEY", KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY)
      .setAlgorithmParameterSpec(ECGenParameterSpec("secp256r1"))
      .setDigests(KeyProperties.DIGEST_SHA256)
      .build()
    
    var keyPairGenerator = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_EC, KEYSTORE_PROVIDER)
    keyPairGenerator.initialize(generator)

    var secretKey = keyPairGenerator.generateKeyPair().private
    var keyFactory = KeyFactory.getInstance(secretKey.getAlgorithm(), KEYSTORE_PROVIDER)
    var keyInfo = keyFactory.getKeySpec(secretKey, KeyInfo::class.java)
    
    return keyInfo.getSecurityLevel() == KeyProperties.SECURITY_LEVEL_TRUSTED_ENVIRONMENT
  }

  internal fun hasBiometrics(): Boolean {
    val biometricManager = BiometricManager.from(context)
    return biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.DEVICE_CREDENTIAL) == BiometricManager.BIOMETRIC_SUCCESS
  }

  @ExpoMethod
  fun getHardwareSecurityLevel(promise: Promise) {
    if (hasStrongbox()) {
      promise.resolve(HardwareSecurityLevel.HARDWARE_ENCLAVE.value)
    } else if (hasTEE()) {
      promise.resolve(HardwareSecurityLevel.TRUSTED_ENVIRONMENT.value)
    } else {
      promise.resolve(HardwareSecurityLevel.SOFTWARE.value)
    }
  }

  @ExpoMethod
  fun getBiometricSecurityLevel(promise: Promise) {
    if (hasBiometrics()) {
      promise.resolve(BiometricSecurityLevel.AVAILABLE.value)
    } else {
      promise.resolve(BiometricSecurityLevel.NONE.value)
    }
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
  fun deleteKeyPair(accountName: String, promise: Promise) {
    try {
      keyManager.deleteKeyPair(accountName)
    } catch (e: Exception) {
      promise.reject("ERR_ENCLAVE_DELETE_KEYPAIR", e.toString())
    }
    promise.resolve("")
  }

  @ExpoMethod
  fun sign(accountName: String, message: String, biometricPromptCopy: ReadableArguments, promise: Promise) {
    keyManager.sign(accountName, message, biometricPromptCopy, promise)
  }

  @ExpoMethod
  fun verify(accountName: String, signature: String, message: String, promise: Promise) {
    promise.resolve(keyManager.verify(accountName, signature, message))
  }
}

enum class HardwareSecurityLevel(val value: String) : Enumerable {
  SOFTWARE("SOFTWARE"),
  TRUSTED_ENVIRONMENT("TRUSTED_ENVIRONMENT"),
  HARDWARE_ENCLAVE("HARDWARE_ENCLAVE"),
}

enum class BiometricSecurityLevel(val value: String) : Enumerable {
  NONE("NONE"),
  AVAILABLE("AVAILABLE"),
}