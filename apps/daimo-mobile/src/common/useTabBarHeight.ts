import { useSafeAreaInsets } from "react-native-safe-area-context";

export const TAB_BAR_HEIGHT = 72;

export default function useTabBarHeight() {
  const { bottom } = useSafeAreaInsets();

  return TAB_BAR_HEIGHT + bottom;
}
