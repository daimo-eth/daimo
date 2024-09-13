import { View } from "react-native";

import { SendDebugLogButton } from "../../common/useSendDebugLog";
import { i18n } from "../../i18n";
import { ButtonMed } from "../shared/Button";
import Spacer from "../shared/Spacer";
import { openSupportTG } from "../shared/error";
import { TextH3, TextLight } from "../shared/text";
import { useTheme } from "../style/theme";

const i18 = i18n.debugBottom;

// Global shake gesture > "Send Debug Log" sheet
export function DebugBottomSheet() {
  const { ss } = useTheme();
  return (
    <View style={ss.container.padH16}>
      <Spacer h={16} />
      <TextH3>{i18.sheetHeader()}</TextH3>
      <Spacer h={12} />
      <TextLight>{i18.description()}</TextLight>
      <Spacer h={32} />
      <ButtonMed
        type="primary"
        title={i18.helpButton()}
        onPress={openSupportTG}
      />
      <Spacer h={16} />
      <SendDebugLogButton />
      <Spacer h={96} />
    </View>
  );
}
