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
import expo.modules.core.arguments.ReadableArguments

// TODO: key lives in non-HW keystore. How do we make sure other apps can't access?
// TODO: show system auth prompt when signing
class FallbackKeyManager: KeyManager {
  internal fun createSigningPrivkey(accountName: String) {
    var params = KeyGenParameterSpec.Builder(accountName, KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY)
      .setAlgorithmParameterSpec(ECGenParameterSpec("secp256r1"))
      .setDigests(KeyProperties.DIGEST_SHA256)
      .build()

    var keyPairGenerator = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_EC, KEYSTORE_PROVIDER)
    keyPairGenerator.initialize(params)
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

  override fun sign(accountName: String, hexMessage: String, biometricPromptCopy: ReadableArguments, promise: Promise) {
    val privateKey = getSigningPrivkey(accountName)!!.private
    val signature = Signature.getInstance("SHA256withECDSA").run {
      initSign(privateKey)
      update(hexMessage.decodeHex())
      sign()
    }
    promise.resolve(signature.toHexString())
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