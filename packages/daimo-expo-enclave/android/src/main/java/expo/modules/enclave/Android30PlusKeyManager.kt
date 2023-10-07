package expo.modules.enclave

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import java.security.spec.ECGenParameterSpec
import java.security.KeyPairGenerator
import java.security.KeyPair
import java.security.KeyStore
import java.security.KeyStoreException
import java.security.Signature
import androidx.biometric.BiometricPrompt
import androidx.biometric.BiometricManager
import androidx.core.content.ContextCompat
import java.util.concurrent.Executor
import androidx.fragment.app.FragmentActivity
import android.content.Context
import expo.modules.core.ModuleRegistry
import expo.modules.core.interfaces.ActivityProvider
import android.app.Activity
import expo.modules.core.interfaces.services.UIManager
import expo.modules.core.Promise
import expo.modules.core.arguments.ReadableArguments
import java.util.concurrent.atomic.AtomicInteger

// Callback invoked when the user has successfully authenticated with biometrics.
fun completeSignature(incompleteSignature: Signature?, message: String, promise: Promise) {
  if (incompleteSignature == null) {
    promise.reject("ERR_BIOMETRIC_AUTHENTICATION_FAILED", "Biometric authentication failed: Incomplete signature")
    return
  }
  incompleteSignature.update(message.decodeHex())
  promise.resolve(incompleteSignature.sign().toHexString())
}

// The key manager we always use on devices using API Level 30 or later
class Android30PlusKeyManager(_context: Context, _moduleRegistry: ModuleRegistry, _useStrongbox: Boolean) : KeyManager {
  private val context = _context
  private val moduleRegistry = _moduleRegistry
  private val uiManager = moduleRegistry.getModule(UIManager::class.java)
  private val useStrongbox = _useStrongbox

  internal fun getCurrentActivity(): Activity? {
    val activityProvider: ActivityProvider = moduleRegistry.getModule(ActivityProvider::class.java)
    return activityProvider.currentActivity
  }

  internal fun createSigningPrivkey(accountName: String) {
    var params = KeyGenParameterSpec.Builder(accountName, KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY)
      .setAlgorithmParameterSpec(ECGenParameterSpec("secp256r1"))
      .setDigests(KeyProperties.DIGEST_SHA256)
      .setUserAuthenticationRequired(true)
      .setUserAuthenticationParameters(0, KeyProperties.AUTH_BIOMETRIC_STRONG or KeyProperties.AUTH_DEVICE_CREDENTIAL)
      .setInvalidatedByBiometricEnrollment(false)

    if (useStrongbox) {
      params.setIsStrongBoxBacked(true)
    }

    var generator = params.build()
    var keyPairGenerator = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_EC, KEYSTORE_PROVIDER)
    keyPairGenerator.initialize(generator)
    keyPairGenerator.generateKeyPair()
  }

  internal fun getSigningPrivkey(accountName: String): KeyPair? {
    val ks: KeyStore = KeyStore.getInstance(KEYSTORE_PROVIDER).apply { load(null) }
    if (!ks.containsAlias(accountName)) {
      return null
    }
    val entry = ks.getEntry(accountName, null)
    if (entry !is KeyStore.PrivateKeyEntry) {
        throw KeyStoreException("Bad format for account private key")
    }
    return KeyPair(entry.certificate.publicKey, entry.privateKey)
  }

  override fun fetchPublicKey(accountName: String): String? {
    return getSigningPrivkey(accountName)?.public?.encoded?.toHexString()
  }
  
  override fun createKeyPair(accountName: String): String {
    createSigningPrivkey(accountName)
    return fetchPublicKey(accountName)!!
  }

  override fun deleteKeyPair(accountName: String) {
    val ks: KeyStore = KeyStore.getInstance(KEYSTORE_PROVIDER).apply { load(null) }
    ks.deleteEntry(accountName)
  }

  override fun sign(accountName: String, hexMessage: String, promptCopy: ReadableArguments, promise: Promise) {
    val biometricManager = BiometricManager.from(context)
    if (biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.DEVICE_CREDENTIAL) != BiometricManager.BIOMETRIC_SUCCESS) {
      promise.reject("ERR_DEVICE_INSECURE", "Pin not set")
      return
    }
    
    val fragmentActivity = getCurrentActivity() as FragmentActivity?
    val failedAttempts = AtomicInteger(0)
    val biometricPrompt = BiometricPrompt(
      fragmentActivity!!, ContextCompat.getMainExecutor(context),
      object : BiometricPrompt.AuthenticationCallback() {
        override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
          super.onAuthenticationError(errorCode, errString)
          promise.reject("ERR_BIOMETRIC_AUTHENTICATION_ERRORED", "Biometric authentication errored: " + errorCode.toString() + " " + errString.toString())
        }

        override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
          super.onAuthenticationSucceeded(result)
          completeSignature(result.cryptoObject!!.getSignature(), hexMessage, promise)
        }

        override fun onAuthenticationFailed() {
          super.onAuthenticationFailed()
          val currentFailedAttempts = failedAttempts.incrementAndGet()
          if (currentFailedAttempts >= 5) {
            promise.reject("ERR_BIOMETRIC_AUTHENTICATION_FAILED", "Biometric authentication failed: Too many failed attempts")
          }
        }
    })

    val promptInfo = BiometricPrompt.PromptInfo.Builder()
      .setTitle(promptCopy.getString("androidTitle"))
      .setSubtitle(promptCopy.getString("usageMessage"))
      .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.DEVICE_CREDENTIAL)
      .build()
    
    val privateKey = getSigningPrivkey(accountName)!!.private
    val signature = Signature.getInstance("SHA256withECDSA")
    signature.initSign(privateKey)
    uiManager.runOnUiQueueThread {
      biometricPrompt.authenticate(promptInfo, BiometricPrompt.CryptoObject(signature))
    }
  }

  override fun verify(accountName: String, hexSignature: String, hexMessage: String): Boolean {
    val publicKey = getSigningPrivkey(accountName)!!.public
    val verified = Signature.getInstance("SHA256withECDSA").run {
      initVerify(publicKey)
      update(hexMessage.decodeHex())
      verify(hexSignature.decodeHex())
    }
    return verified
  }
}