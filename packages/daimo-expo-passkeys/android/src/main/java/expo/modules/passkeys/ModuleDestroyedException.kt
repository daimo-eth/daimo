package expo.modules.passkeys

import kotlinx.coroutines.CancellationException

class ModuleDestroyedException : CancellationException("Module destroyed, all promises canceled")