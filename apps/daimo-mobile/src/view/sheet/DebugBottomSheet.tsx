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
      <TextH3>Did something go wrong?</TextH3>
      <Spacer h={12} />
      <TextLight>
        Contact us on Telegram, then tap Send Debug Log to send us more
        information. We'll get to the bottom of it.
      </TextLight>
      <Spacer h={32} />
      <ButtonMed
        type="primary"
        title="CONTACT SUPPORT"
        onPress={openSupportTG}
      />
      <Spacer h={16} />
      <SendDebugLogButton />
      <Spacer h={96} />
    </View>
  );
}
