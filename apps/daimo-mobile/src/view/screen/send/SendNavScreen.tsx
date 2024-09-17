import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useRef, useState } from "react";
import { Keyboard, TouchableWithoutFeedback, View } from "react-native";
import { TextInput } from "react-native-gesture-handler";

import { ParamListSend } from "../../../common/nav";
import { i18n } from "../../../i18n";
import { ScreenHeader } from "../../shared/ScreenHeader";
import { SearchScreen } from "../../shared/SearchScreen";
import Spacer from "../../shared/Spacer";
import { useTheme } from "../../style/theme";

type Props = NativeStackScreenProps<ParamListSend, "SendNav">;
const i18 = i18n.sendNav;

export function SendNavScreen({ route }: Props) {
  const { ss } = useTheme();
  const { autoFocus } = route.params || {};

  // Search prefix
  // Clear prefix on back button
  const [prefix, setPrefix] = useState("");

  // Focus search box if autoFocus is true
  // Work around react-navigation autofocus bug
  const textInputRef = useRef<TextInput>(null);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={ss.container.screen}>
        <ScreenHeader title={i18.screenHeader()} />
        <Spacer h={8} />
        <View style={{ flex: 1, flexDirection: "column" }}>
          <SearchScreen
            {...{ prefix, setPrefix, textInputRef, autoFocus }}
            mode="send"
          />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
