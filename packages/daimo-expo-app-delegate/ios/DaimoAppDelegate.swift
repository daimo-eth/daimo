import ExpoModulesCore
import SystemConfiguration

public class DaimoAppDelegate: ExpoAppDelegateSubscriber {

  private func isOnMac() -> Bool {
    #if targetEnvironment(macCatalyst)
      return true
    #else
      if #available(iOS 14.0, macOS 11.0, watchOS 7.0, tvOS 14.0, *) {
        return ProcessInfo.processInfo.isiOSAppOnMac
      }
      return false
    #endif
  }

  public func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
    
    if self.isOnMac() {
      UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.forEach { windowScene in
        windowScene.sizeRestrictions?.minimumSize = CGSize(width: 500, height: 900)
        windowScene.sizeRestrictions?.maximumSize = CGSize(width: 500, height: 900)
      }
    }

    return true
  }
}