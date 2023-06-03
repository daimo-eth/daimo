package expo.modules.enclave

fun ByteArray.toHexString() = joinToString("") { "%02x".format(it) }
fun String.decodeHex(): ByteArray {
    check(length % 2 == 0) { "Must have an even length" }

    return chunked(2)
        .map { it.toInt(16).toByte() }
        .toByteArray()
}

const val KEYSTORE_PROVIDER = "AndroidKeyStore"