import { ReactElement } from "react";
import { View } from "react-native";

import { useI18n } from "../../logic/i18n";
import { ButtonMed } from "../shared/Button";
import Spacer from "../shared/Spacer";
import { ss } from "../shared/style";
import { TextCenter, TextH3 } from "../shared/text";

export function HelpBottomSheet({
  content,
  title,
  onPress,
}: {
  content: ReactElement;
  title: string;
  onPress(): void;
}) {
  const i18n = useI18n().helpBottom;
  return (
    <View style={ss.container.padH16}>
      <Spacer h={16} />
      <TextCenter>
        <TextH3>{title}</TextH3>
      </TextCenter>
      <Spacer h={24} />
      {content}
      <Spacer h={32} />
      <ButtonMed title={i18n.gotItButton()} onPress={onPress} type="subtle" />
      <Spacer h={48} />
    </View>
  );
}
