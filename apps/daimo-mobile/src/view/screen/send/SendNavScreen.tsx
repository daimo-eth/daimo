import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useRef, useState } from "react";
import { Keyboard, TouchableWithoutFeedback, View } from "react-native";
import { TextInput } from "react-native-gesture-handler";

import { ParamListSend } from "../../../common/nav";
import { useI18n } from "../../../logic/i18n";
import { ScreenHeader } from "../../shared/ScreenHeader";
import { SearchScreen } from "../../shared/SearchScreen";
import Spacer from "../../shared/Spacer";
import { ss } from "../../shared/style";

type Props = NativeStackScreenProps<ParamListSend, "SendNav">;

export function SendNavScreen({ route }: Props) {
  const i18n = useI18n().sendNav;
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
        <ScreenHeader title={i18n.screenHeader()} />
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
