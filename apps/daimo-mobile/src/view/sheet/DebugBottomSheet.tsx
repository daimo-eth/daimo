import { View } from "react-native";

import { useSendDebugLog } from "../../common/useSendDebugLog";
import { ButtonMed } from "../shared/Button";
import Spacer from "../shared/Spacer";
import { ss } from "../shared/style";
import { TextH3, TextLight } from "../shared/text";

// Global shake gesture > "Send Debug Log" sheet
export function DebugBottomSheet() {
  const [sendDL] = useSendDebugLog();

  return (
    <View style={ss.container.screen}>
      <View style={ss.container.padH16}>
        <Spacer h={16} />
        <TextH3>Did something go wrong?</TextH3>
        <Spacer h={12} />
        <TextLight>Help us realize what's going wrong.</TextLight>
        <Spacer h={32} />
        <ButtonMed type="subtle" title="Send debug log" onPress={sendDL} />
      </View>
    </View>
  );
}
