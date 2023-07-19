import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { View } from "react-native";

import { Header } from "../shared/Header";
import { HomeStackParamList } from "../shared/nav";
import { ss } from "../shared/style";
import { TextBold } from "../shared/text";

type Props = NativeStackScreenProps<HomeStackParamList, "UseExisting">;

export function UseExistingScreen({ navigation }: Props) {
  return (
    <View style={ss.container.vertModal}>
      <Header />
      <TextBold>coming soon</TextBold>
    </View>
  );
}
