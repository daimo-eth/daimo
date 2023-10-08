package expo.modules.enclave

import expo.modules.core.Promise
import expo.modules.core.arguments.ReadableArguments

interface KeyManager {
  fun createKeyPair(accountName: String): String
  fun deleteKeyPair(accountName: String)
  fun fetchPublicKey(accountName: String): String?
  fun sign(accountName: String, hexMessage: String, promptCopy: ReadableArguments, promise: Promise)
  fun verify(accountName: String, hexSignature: String, hexMessage: String): Boolean
}