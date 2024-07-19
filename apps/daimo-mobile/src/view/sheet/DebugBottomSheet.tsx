import { View } from "react-native";

import { SendDebugLogButton } from "../../common/useSendDebugLog";
import { useI18n } from "../../logic/i18n";
import { ButtonMed } from "../shared/Button";
import Spacer from "../shared/Spacer";
import { openSupportTG } from "../shared/error";
import { ss } from "../shared/style";
import { TextH3, TextLight } from "../shared/text";

// Global shake gesture > "Send Debug Log" sheet
export function DebugBottomSheet() {
  const i18n = useI18n().debugBottom;
  return (
    <View style={ss.container.padH16}>
      <Spacer h={16} />
      <TextH3>{i18n.sheetHeader()}</TextH3>
      <Spacer h={12} />
      <TextLight>{i18n.description()}</TextLight>
      <Spacer h={32} />
      <ButtonMed
        type="primary"
        title={i18n.helpButton()}
        onPress={openSupportTG}
      />
      <Spacer h={16} />
      <SendDebugLogButton />
      <Spacer h={96} />
    </View>
  );
}
