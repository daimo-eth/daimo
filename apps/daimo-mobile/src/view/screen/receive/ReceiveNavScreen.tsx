import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useRef, useState } from "react";
import { Keyboard, TouchableWithoutFeedback, View } from "react-native";
import { TextInput } from "react-native-gesture-handler";

import { ReceiveSearch } from "./SearchScreen";
import { ScreenHeader } from "../../shared/ScreenHeader";
import Spacer from "../../shared/Spacer";
import { ParamListHome, useExitToHome, useNav } from "../../shared/nav";
import { ss } from "../../shared/style";

type Props = NativeStackScreenProps<ParamListHome, "ReceiveSearch">;

export function ReceiveNavScreen({ route }: Props) {
  const { autoFocus } = route.params || {};

  // Search prefix
  // Clear prefix on back button
  const [prefix, setPrefix] = useState("");

  // Navigation
  const nav = useNav();
  const goHome = useExitToHome();
  const goBack = useCallback(() => {
    setPrefix("");
    goHome();
  }, [nav, goHome]);

  // Focus search box if autoFocus is true
  // Work around react-navigation autofocus bug
  const textInputRef = useRef<TextInput>(null);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={ss.container.screen}>
        <ScreenHeader title="Request" onBack={goBack} />
        <Spacer h={8} />
        <View style={{ flex: 1, flexDirection: "column" }}>
          <ReceiveSearch {...{ prefix, setPrefix, textInputRef, autoFocus }} />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
