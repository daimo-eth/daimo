import { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard, TouchableWithoutFeedback, View } from "react-native";
import { TextInput } from "react-native-gesture-handler";

import { useNav } from "../../../common/nav";
import { i18n } from "../../../i18n";
import { ScreenHeader } from "../../shared/ScreenHeader";
import { SearchScreen } from "../../shared/SearchScreen";
import Spacer from "../../shared/Spacer";
import { useTheme } from "../../style/theme";

const i18 = i18n.receiveNav;

export function ReceiveNavScreen() {
  const { ss } = useTheme();

  // Search prefix
  // Clear prefix on back button
  const [prefix, setPrefix] = useState("");

  // Navigation
  const nav = useNav();
  const goBack = useCallback(() => {
    setPrefix("");
    nav.goBack();
  }, [nav]);

  const textInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const unsubscribe = nav.addListener("transitionEnd", () => {
      // Set focus on transitionEnd to avoid stack navigator looking
      // glitchy on iOS.
      textInputRef.current?.focus();
    });

    return unsubscribe;
  }, []);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={ss.container.screen}>
        <ScreenHeader title={i18.screenHeader()} onBack={goBack} />
        <Spacer h={8} />
        <View style={{ flex: 1, flexDirection: "column" }}>
          <SearchScreen
            {...{ prefix, setPrefix, textInputRef }}
            mode="receive"
          />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
