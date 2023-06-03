package expo.modules.enclave

import expo.modules.core.Promise

interface KeyManager {
  fun createKeyPair(accountName: String): String
  fun fetchPublicKey(accountName: String): String?
  fun sign(accountName: String, hexMessage: String, promise: Promise)
  fun verify(accountName: String, hexSignature: String, hexMessage: String): Boolean
}