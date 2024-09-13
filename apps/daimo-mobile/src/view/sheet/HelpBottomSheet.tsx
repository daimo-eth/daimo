import { ReactElement } from "react";
import { View } from "react-native";

import { i18n } from "../../i18n";
import { ButtonMed } from "../shared/Button";
import Spacer from "../shared/Spacer";
import { TextCenter, TextH3 } from "../shared/text";
import { useTheme } from "../style/theme";

const i18 = i18n.helpBottom;

export function HelpBottomSheet({
  content,
  title,
  onPress,
}: {
  content: ReactElement;
  title: string;
  onPress(): void;
}) {
  const { ss } = useTheme();
  return (
    <View style={ss.container.padH16}>
      <Spacer h={16} />
      <TextCenter>
        <TextH3>{title}</TextH3>
      </TextCenter>
      <Spacer h={24} />
      {content}
      <Spacer h={32} />
      <ButtonMed title={i18.gotItButton()} onPress={onPress} type="subtle" />
      <Spacer h={48} />
    </View>
  );
}
