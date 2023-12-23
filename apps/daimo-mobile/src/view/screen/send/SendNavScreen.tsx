import { useIsFocused } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useRef, useState } from "react";
import { Keyboard, TouchableWithoutFeedback, View } from "react-native";
import { TextInput } from "react-native-gesture-handler";

import { SearchTab } from "./SearchTab";
import { ScreenHeader } from "../../shared/ScreenHeader";
import Spacer from "../../shared/Spacer";
import {
  ParamListSend,
  useExitToHome,
  useFocusOnScreenTransitionEnd,
  useNav,
} from "../../shared/nav";
import { ss } from "../../shared/style";

type Props = NativeStackScreenProps<ParamListSend, "SendNav">;

export function SendNavScreen({ route }: Props) {
  const { autoFocus } = route.params || {};

  // Search prefix
  // Clear prefix on back button
  const [prefix, setPrefix] = useState("");

  // Navigation
  const nav = useNav();
  const goHome = useExitToHome();
  const goBack = useCallback(() => {
    setPrefix("");
    if (nav.canGoBack()) nav.goBack();
    else goHome();
  }, [nav, goHome]);

  // Focus search box if autoFocus is true
  // Work around react-navigation autofocus bug
  const textInputRef = useRef<TextInput>(null);
  const isFocused = useIsFocused();
  useFocusOnScreenTransitionEnd(textInputRef, nav, isFocused, autoFocus);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={ss.container.screen}>
        <ScreenHeader title="Send" onBack={goBack} />
        <Spacer h={8} />
        <View style={{ flex: 1, flexDirection: "column" }}>
          <SearchTab {...{ prefix, setPrefix, textInputRef }} />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
