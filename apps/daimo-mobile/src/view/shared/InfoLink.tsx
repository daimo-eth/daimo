import { Octicons } from "@expo/vector-icons";
import { Linking, View } from "react-native";

import { ButtonSmall } from "./Button";
import { color, ss } from "./style";
import { TextSmall } from "./text";

export function InfoLink({ url, title }: { url: string; title: string }) {
  return (
    <View style={ss.container.mhn16}>
      <ButtonSmall onPress={() => Linking.openURL(url)}>
        <TextSmall>
          <Octicons name="info" size={16} color={color.gray} />
          {` \u00A0 `}
          {title}
        </TextSmall>
      </ButtonSmall>
    </View>
  );
}
