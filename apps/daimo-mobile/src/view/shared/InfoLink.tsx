import Octicons from "@expo/vector-icons/Octicons";
import { Linking, View } from "react-native";

import { ButtonSmall } from "./Button";
import { color, ss } from "./style";
import { TextLight } from "./text";

export function InfoLink({ url, title }: { url: string; title: string }) {
  return (
    <View style={ss.container.marginHNeg16}>
      <ButtonSmall onPress={() => Linking.openURL(url)}>
        <TextLight>
          <Octicons name="info" size={16} color={color.gray} />
          {` \u00A0 `}
          {title}
        </TextLight>
      </ButtonSmall>
    </View>
  );
}
