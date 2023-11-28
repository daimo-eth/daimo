import { useIsFocused } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useRef } from "react";
import { Keyboard, TouchableWithoutFeedback, View } from "react-native";
import { TextInput } from "react-native-gesture-handler";

import { SearchTab } from "./SearchTab";
import { ScreenHeader, useExitToHome } from "../../shared/ScreenHeader";
import Spacer from "../../shared/Spacer";
import { ParamListSend, useNav } from "../../shared/nav";
import { ss } from "../../shared/style";

type Props = NativeStackScreenProps<ParamListSend, "SendNav">;

export function SendNavScreen({ route }: Props) {
  const { autoFocus } = route.params || {};

  const nav = useNav();
  const goHome = useExitToHome();
  const goBack = nav.canGoBack() ? nav.goBack : goHome;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={ss.container.screen}>
        <ScreenHeader title="Send" onBack={goBack} />
        <Spacer h={8} />
        <SendNav {...{ autoFocus }} />
      </View>
    </TouchableWithoutFeedback>
  );
}

function SendNav({ autoFocus }: { autoFocus: boolean }) {
  // Navigation
  const textInputRef = useRef<TextInput>(null);
  const isFocused = useIsFocused();
  const nav = useNav();

  useEffect(() => {
    let focusTimeout;
    if (isFocused && autoFocus) {
      const { setParams }: { setParams: any } = nav;
      setParams({
        autoFocus: false,
      });
      // wait for the screen transition animation to finish before open keyboard
      focusTimeout = setTimeout(() => {
        textInputRef.current?.focus();
      }, 500);
    }

    if (!isFocused) {
      clearTimeout(focusTimeout);
    }
  }, [isFocused, autoFocus]);

  return (
    <View style={{ flex: 1, flexDirection: "column" }}>
      <SearchTab {...{ autoFocus }} textInnerRef={textInputRef} />
    </View>
  );
}
