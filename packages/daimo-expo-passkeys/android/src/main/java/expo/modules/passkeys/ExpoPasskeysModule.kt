package expo.modules.passkeys

import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import expo.modules.core.interfaces.ExpoMethod
import expo.modules.core.ModuleRegistry
import expo.modules.core.ExportedModule
import expo.modules.core.Promise
import expo.modules.core.arguments.ReadableArguments
import java.security.spec.ECGenParameterSpec
import java.security.KeyPairGenerator
import android.security.keystore.KeyInfo
import java.security.KeyFactory
import expo.modules.kotlin.types.Enumerable
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import expo.modules.core.interfaces.ActivityProvider
import android.app.Activity
import androidx.credentials.CredentialManager
import androidx.credentials.CreatePublicKeyCredentialRequest
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetPublicKeyCredentialOption
import androidx.credentials.exceptions.*
import androidx.credentials.exceptions.publickeycredential.CreatePublicKeyCredentialDomException
import androidx.credentials.exceptions.publickeycredential.GetPublicKeyCredentialDomException

// Note that this is a ExportedModule, not a Module as expo recommends.
// As far as I can tell, using a ExportedModule is the only way to get context, 
// as seen in the official [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/)
// and [expo-sensors](https://docs.expo.dev/versions/latest/sdk/sensors/) packages.
// Unfortunately, ExportedModule is not documented well, so much of the
// design of this module is modeled after those two packages.
class ExpoPasskeysModule(context: Context) : ExportedModule(context) {
  val REGISTRATION_RESPONSE = "androidx.credentials.BUNDLE_KEY_REGISTRATION_RESPONSE_JSON"
  val AUTH_RESPONSE = "androidx.credentials.BUNDLE_KEY_AUTHENTICATION_RESPONSE_JSON"

  private val moduleCoroutineScope = CoroutineScope(Dispatchers.Default)
  lateinit var moduleRegistry: ModuleRegistry

  override fun onCreate(_moduleRegistry: ModuleRegistry) {
    moduleRegistry = _moduleRegistry
  }

  override fun onDestroy() {
    moduleCoroutineScope.cancel(ModuleDestroyedException())
  }

  override fun getName() = "ExpoPasskeys"

  internal fun getCurrentActivity(): Activity? {
    val activityProvider: ActivityProvider = moduleRegistry.getModule(ActivityProvider::class.java)
    return activityProvider.currentActivity
  }

  @ExpoMethod
  fun createPasskey(requestJSON: String, promise: Promise) {
    val credentialManager = CredentialManager.create(context)
    val createPublicKeyCredentialRequest = CreatePublicKeyCredentialRequest(requestJSON)
    val currentActivity = getCurrentActivity()

    moduleCoroutineScope.launch {
      try {
        val result = currentActivity?.let { credentialManager.createCredential(it, createPublicKeyCredentialRequest) }
        val response = result?.data?.getString(REGISTRATION_RESPONSE)
        promise.resolve(response)
      } catch (e: Exception) {
        promise.reject("Error", e.toString())
      }
    }
  }

  @ExpoMethod
  fun signWithPasskey(requestJSON: String, promise: Promise) {
    val credentialManager = CredentialManager.create(context)
    val getCredentialRequest =
        GetCredentialRequest(listOf(GetPublicKeyCredentialOption(requestJSON)))
    val currentActivity = getCurrentActivity()

    moduleCoroutineScope.launch {
      try {
        val result = currentActivity?.let { credentialManager.getCredential(it, getCredentialRequest) }
        val response = result?.credential?.data?.getString(AUTH_RESPONSE)
        promise.resolve(response)
      } catch (e: Exception) {
        promise.reject("Error", e.toString())
      }
    }
  }
}
