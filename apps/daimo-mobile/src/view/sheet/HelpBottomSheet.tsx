import { ReactElement } from "react";
import { View } from "react-native";

import { ButtonMed } from "../shared/Button";
import Spacer from "../shared/Spacer";
import { ss } from "../shared/style";
import { TextCenter, TextH3 } from "../shared/text";

// Global shake gesture > "Send Debug Log" sheet
export function HelpBottomSheet({
  content,
  title,
  onPress,
}: {
  content: ReactElement;
  title: string;
  onPress(): void;
}) {
  return (
    <View style={ss.container.padH16}>
      <Spacer h={16} />
      <TextCenter>
        <TextH3>{title}</TextH3>
      </TextCenter>
      <Spacer h={12} />
      {content}
      <Spacer h={32} />
      <ButtonMed title="GOT IT" onPress={onPress} type="subtle" />
      <Spacer h={24} />
    </View>
  );
}
