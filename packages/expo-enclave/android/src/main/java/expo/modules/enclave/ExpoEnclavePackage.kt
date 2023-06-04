package expo.modules.enclave

import android.content.Context

import expo.modules.core.BasePackage
import expo.modules.core.ExportedModule
import expo.modules.core.interfaces.InternalModule

// This boilerplate is required to register the ExpoEnclaveModule, an ExportedModule, 
// as a Module with Expo.
class ExpoEnclavePackage : BasePackage() {
  override fun createInternalModules(context: Context): List<InternalModule> =
    emptyList()

  override fun createExportedModules(reactContext: Context): List<ExportedModule> =
    listOf(ExpoEnclaveModule(reactContext))
}