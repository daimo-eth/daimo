import { View } from "react-native";

import { SendDebugLogButton } from "../../common/useSendDebugLog";
import { ButtonMed } from "../shared/Button";
import Spacer from "../shared/Spacer";
import { openSupportTG } from "../shared/error";
import { ss } from "../shared/style";
import { TextH3, TextLight } from "../shared/text";

// Global shake gesture > "Send Debug Log" sheet
export function DebugBottomSheet() {
  return (
    <View style={ss.container.padH16}>
      <Spacer h={16} />
      <TextH3>Is Anything Wrong?</TextH3>
      <Spacer h={12} />
      <TextLight>Contact us on Telegram</TextLight>
      <Spacer h={32} />
      <ButtonMed
        type="primary"
        title="CONTACT SUPPORT"
        onPress={openSupportTG}
      />
      <Spacer h={32} />
      <SendDebugLogButton />
      <Spacer h={128} />
    </View>
  );
}
