import { Alert, Platform, Share, ShareAction } from "react-native";

// Share via system share sheet = user picks messaging app
export async function shareURL(url: string): Promise<boolean> {
  try {
    let result: ShareAction;
    if (Platform.OS === "android") {
      result = await Share.share({ message: url });
    } else {
      result = await Share.share({ url }); // Default behavior for iOS
    }

    console.log(`[SHARESHEET] action ${result.action}`);
    if (result.action === Share.sharedAction) {
      console.log(`[SHARESHEET] shared, activityType: ${result.activityType}`);
      return true;
    } else if (result.action === Share.dismissedAction) {
      console.log(`[SHARESHEET] share dismissed`); // Only on iOS
    }
  } catch (error: any) {
    Alert.alert(error.message);
  }
  return false;
}
