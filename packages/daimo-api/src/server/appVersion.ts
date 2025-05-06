import { assertEqual } from "@daimo/common";

import { fetchWithBackoff } from "../network/fetchWithBackoff";

let appVersionTracker = null as AppVersionTracker | null;

export function getAppVersionTracker() {
  if (appVersionTracker == null) {
    appVersionTracker = new AppVersionTracker();
  }
  return appVersionTracker;
}

export class AppVersionTracker {
  private latestVersion = null as string | null;

  // Start polling for app version updates
  init() {
    // Check for updates every 5 minutes
    this.checkVersion();
    setInterval(() => this.checkVersion(), 5 * 60 * 1000);
  }

  getLatestVersion() {
    return this.latestVersion;
  }

  // Check for updates
  async checkVersion() {
    try {
      this.latestVersion = await this.getLatestVersionIOS();
      console.log(
        `[APP-VERSION] got latest iOS version: ${this.latestVersion}`
      );
    } catch (e) {
      console.error(`[APP-VERSION] error checking iOS version`, e);
    }
  }

  async getLatestVersionIOS() {
    const url = "https://itunes.apple.com/lookup?bundleId=com.daimo";
    const response = await fetchWithBackoff(url);
    const json = await response.json();
    assertEqual(json.resultCount, 1, "Unexpected result count");

    const { bundleId, currentVersionReleaseDate, version } = json.results[0];
    const obj = { bundleId, currentVersionReleaseDate, version };
    console.log(`[APP-VERSION] latest iOS app bundle: ${JSON.stringify(obj)}`);
    return version;
  }
}
