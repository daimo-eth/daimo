import SegmentedControl from "@react-native-segmented-control/segmented-control";

import { useTheme } from "../style/theme";

export function SegmentSlider<T extends string>({
  tabs,
  tab,
  setTab,
}: {
  tabs: T[];
  tab: T;
  setTab: (tab: T) => void;
}) {
  const { ss, color } = useTheme();
  return (
    <SegmentedControl
      values={tabs}
      onValueChange={setTab as (tab: string) => void}
      selectedIndex={tabs.indexOf(tab)}
      fontStyle={{ ...ss.text.body, fontSize: 14, color: color.grayDark }}
      activeFontStyle={{ ...ss.text.body, fontSize: 14, color: color.midnight }}
      style={{ height: 48, backgroundColor: color.ivoryDark }}
    />
  );
}
