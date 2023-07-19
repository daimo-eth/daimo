import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { View } from "react-native";

import { Header } from "../shared/Header";
import { HomeStackParamList } from "../shared/nav";
import { ss } from "../shared/style";
import { TextBold } from "../shared/text";

type Props = NativeStackScreenProps<HomeStackParamList, "AddDevice">;

export function AddDeviceScreen({ navigation }: Props) {
  return (
    <View style={ss.container.vertModal}>
      <Header />
      <TextBold>coming soon</TextBold>
    </View>
  );
}
