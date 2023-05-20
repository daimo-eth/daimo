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

fun ByteArray.toHexString() = joinToString("") { "%02x".format(it) }
fun String.decodeHex(): ByteArray {
    check(length % 2 == 0) { "Must have an even length" }

    return chunked(2)
        .map { it.toInt(16).toByte() }
        .toByteArray()
}

class KeyManager {
  val KEYSTORE_PROVIDER = "AndroidKeyStore"

  internal fun createSigningPrivkey(accountName: String) {
    var params = KeyGenParameterSpec.Builder(accountName, KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY)
      .setAlgorithmParameterSpec(ECGenParameterSpec("secp256r1"))
      .setDigests(KeyProperties.DIGEST_SHA256)
      // TODO:
      // .setUserAuthenticationRequired(true)
      // .setUserConfirmationRequired(true)
      // .setUserPresenceRequired(true)
      // .setIsStrongBoxBacked(true)
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
    return false
  }

  public fun createKeyPair(accountName: String): String {
    createSigningPrivkey(accountName)
    return getSigningPrivkey(accountName).public.encoded.toHexString()
  }

  public fun fetchPublicKey(accountName: String): String? {
    var publicKey = getSigningPrivkey(accountName).public.getY()
    var publicKeyRaw = publicKey.getAffineX().toString(16) + publicKey.getAffineY().toString(16)
    return publicKeyRaw
  }

  public fun sign(accountName: String, hexMessage: String): String {
    val privateKey = getSigningPrivkey(accountName).private
    val signature = Signature.getInstance("SHA256withECDSA").run {
      initSign(privateKey)
      update(hexMessage.decodeHex())
      sign()
    }
    return signature.toHexString()
  }

  public fun verify(accountName: String, hexMessage: String, hexSignature: String): Boolean {
    val privateKey = getSigningPrivkey(accountName).private
    val signature = Signature.getInstance("SHA256withECDSA").run {
      initSign(privateKey)
      update(hexMessage.decodeHex())
      sign()
    }

    val publicKey = getSigningPrivkey(accountName).public
    val verified = Signature.getInstance("SHA256withECDSA").run {
      initVerify(publicKey)
      update(hexMessage.decodeHex())
      verify(signature)
    }
    return verified
  }
}