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
import androidx.core.content.ContextCompat
import java.util.concurrent.Executor
import androidx.fragment.app.FragmentActivity
import android.content.Context
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

// Callback invoked when the user has successfully authenticated with biometrics.
fun completeSignature(incompleteSignature: Signature?, message: String, promise: Promise) {
  if (incompleteSignature == null) {
    promise.reject("ERR_BIOMETRIC_AUTHENTICATION_FAILED", "Biometric authentication failed")
  }
  incompleteSignature.update(message.decodeHex())
  promise.resolve(incompleteSignature.sign().toHexString())
}

class FallbackKeyManager {
  private val KEYSTORE_PROVIDER = "AndroidKeyStore"

  internal fun createSigningPrivkey(accountName: String) {
    var params = KeyGenParameterSpec.Builder(accountName, KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY)
      .setAlgorithmParameterSpec(ECGenParameterSpec("secp256r1"))
      .setDigests(KeyProperties.DIGEST_SHA256)
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

  public fun createKeyPair(accountName: String): String {
    createSigningPrivkey(accountName)
    return getSigningPrivkey(accountName).public.encoded.toHexString()
  }

  public fun fetchPublicKey(accountName: String): String? {
    return getSigningPrivkey(accountName).public.encoded.toHexString()
  }

  public fun sign(accountName: String, hexMessage: String, promise: Promise) {
    val fragmentActivity = getCurrentActivity() as FragmentActivity?
    val biometricPrompt = BiometricPrompt(
      fragmentActivity!!, ContextCompat.getMainExecutor(context),
      object : BiometricPrompt.AuthenticationCallback() {
        override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
          super.onAuthenticationError(errorCode, errString)
          promise.reject("ERR_BIOMETRIC_AUTHENTICATION_ERRORED", "Biometric authentication errored")
        }

        override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
          super.onAuthenticationSucceeded(result)
          completeSignature(result.cryptoObject!!.getSignature(), hexMessage, promise)
        }

        override fun onAuthenticationFailed() {
          super.onAuthenticationFailed()
          promise.reject("ERR_BIOMETRIC_AUTHENTICATION_FAILED", "Biometric authentication failed")
        }
    })

    val promptInfo = BiometricPrompt.PromptInfo.Builder()
      .setTitle("Authorise transaction")
      .setSubtitle("Sign Daimo tx " + hexMessage)
      .setNegativeButtonText("Cancel")
      .build()
    
    val privateKey = getSigningPrivkey(accountName).private
    val signature = Signature.getInstance("SHA256withECDSA")
    signature.initSign(privateKey)
    uiManager.runOnUiQueueThread {
      biometricPrompt.authenticate(promptInfo, BiometricPrompt.CryptoObject(signature))
    }
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