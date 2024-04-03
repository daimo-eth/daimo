import { View } from "react-native";

import { SendDebugLogButton } from "../../common/useSendDebugLog";
import Spacer from "../shared/Spacer";
import { ss } from "../shared/style";
import { TextH3, TextLight } from "../shared/text";

// Global shake gesture > "Send Debug Log" sheet
export function DebugBottomSheet() {
  return (
    <View style={ss.container.padH16}>
      <Spacer h={16} />
      <TextH3>Did something go wrong?</TextH3>
      <Spacer h={12} />
      <TextLight>Help us realize what's going wrong.</TextLight>
      <Spacer h={32} />
      <SendDebugLogButton />
      <Spacer h={48} />
    </View>
  );
}
