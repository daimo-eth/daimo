package expo.modules.enclave

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import java.security.spec.ECGenParameterSpec
import java.security.KeyPairGenerator
import java.security.KeyPair
import java.security.KeyStore
import java.security.KeyStoreException
import java.security.Signature
import org.bouncycastle.jce.ECPointUtil
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import java.util.concurrent.Executor
import android.os.Bundle
import androidx.fragment.app.FragmentActivity
import android.content.Context
import java.util.concurrent.Executors
import expo.modules.core.ModuleRegistry
import expo.modules.core.interfaces.ActivityProvider
import android.app.Activity
import expo.modules.core.interfaces.services.UIManager
import expo.modules.core.Promise
import android.os.Build
import android.content.pm.PackageManager


fun ByteArray.toHexString() = joinToString("") { "%02x".format(it) }
fun String.decodeHex(): ByteArray {
    check(length % 2 == 0) { "Must have an even length" }

    return chunked(2)
        .map { it.toInt(16).toByte() }
        .toByteArray()
}

class SigningCallback(_message: String) {
  public val message = _message

  fun invoke(readySignature: Signature?, promise: Promise) {
    if (readySignature == null) {
      return
    }
    readySignature.update(message.decodeHex())
    promise.resolve(readySignature.sign().toHexString())
  }
}

class KeyManager(_context: Context, _moduleRegistry: ModuleRegistry) {
  val KEYSTORE_PROVIDER = "AndroidKeyStore"
  var context = _context
  var moduleRegistry = _moduleRegistry
  private val uiManager = moduleRegistry.getModule(UIManager::class.java)
  var postBiometryResult = ""

  private fun getCurrentActivity(): Activity? {
    val activityProvider: ActivityProvider = moduleRegistry.getModule(ActivityProvider::class.java)
    return activityProvider.currentActivity
  }


  internal fun authenticateAndRun(accountName: String, callback: SigningCallback, promise: Promise) {
    val fragmentActivity = getCurrentActivity() as FragmentActivity?
    val biometricPrompt = BiometricPrompt(
      fragmentActivity!!, ContextCompat.getMainExecutor(context),
      object : BiometricPrompt.AuthenticationCallback() {
        override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
          super.onAuthenticationError(errorCode, errString)
        }

        override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
          callback.invoke(result.cryptoObject!!.getSignature(), promise)
          super.onAuthenticationSucceeded(result)
        }

        override fun onAuthenticationFailed() {
          super.onAuthenticationFailed()
        }
    })

    val promptInfo = BiometricPrompt.PromptInfo.Builder()
      .setTitle("Authorise transaction")
      .setSubtitle("Sign transaction " + callback.message + " using your private key")
      .setNegativeButtonText("Cancel")
      .build()
    
    val privateKey = getSigningPrivkey(accountName).private
    val signature = Signature.getInstance("SHA256withECDSA")
    signature.initSign(privateKey)
    uiManager.runOnUiQueueThread {
      biometricPrompt.authenticate(promptInfo, BiometricPrompt.CryptoObject(signature))
    }
  }


  internal fun createSigningPrivkey(accountName: String) {
    var params = KeyGenParameterSpec.Builder(accountName, KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY)
      .setAlgorithmParameterSpec(ECGenParameterSpec("secp256r1"))
      .setDigests(KeyProperties.DIGEST_SHA256)
      .setUserAuthenticationRequired(true)
      .setUserAuthenticationParameters(0, KeyProperties.AUTH_BIOMETRIC_STRONG or KeyProperties.AUTH_DEVICE_CREDENTIAL)
      .setIsStrongBoxBacked(true)
      .build()

    var keyPairGenerator = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_EC, KEYSTORE_PROVIDER)
    keyPairGenerator.initialize(params)
    keyPairGenerator.generateKeyPair()
  }

  internal fun getSigningPrivkey(accountName: String): KeyPair {
    val ks: KeyStore = KeyStore.getInstance(KEYSTORE_PROVIDER).apply { load(null) }
    if (!ks.containsAlias(accountName)) {
      throw KeyStoreException("Unable to read account private key")
    }
    val entry = ks.getEntry(accountName, null)
    if (entry !is KeyStore.PrivateKeyEntry) {
        throw KeyStoreException("Bad format for account private key")
    }
    return KeyPair(entry.certificate.publicKey, entry.privateKey)
  }

  public fun isSecureEnclaveAvailable(): Boolean {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        return context.packageManager.hasSystemFeature(
            PackageManager.FEATURE_STRONGBOX_KEYSTORE
        )
    } else {
      return false
    }
  }

  public fun createKeyPair(accountName: String): String {
    createSigningPrivkey(accountName)
    return getSigningPrivkey(accountName).public.encoded.toHexString()
  }

  public fun fetchPublicKey(accountName: String): String? {
    return getSigningPrivkey(accountName).public.encoded.toHexString()
  }

  public fun sign(accountName: String, hexMessage: String, promise: Promise) {
    val signingCallback = SigningCallback(hexMessage)
    authenticateAndRun(accountName, signingCallback, promise)
  }

  public fun verify(accountName: String, hexSignature: String, hexMessage: String): Boolean {
    val publicKey = getSigningPrivkey(accountName).public
    val verified = Signature.getInstance("SHA256withECDSA").run {
      initVerify(publicKey)
      update(hexMessage.decodeHex())
      verify(hexSignature.decodeHex())
    }
    return verified
  }
}