import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import { Keyboard, TouchableWithoutFeedback, View } from "react-native";

import { SearchTab } from "./SearchTab";
import { SendNoteScreen } from "./SendNoteScreen";
import { ScreenHeader, useExitToHome } from "../../shared/ScreenHeader";
import { SegmentSlider } from "../../shared/SegmentSlider";
import Spacer from "../../shared/Spacer";
import { ParamListSend, useNav } from "../../shared/nav";
import { ss } from "../../shared/style";

type Props = NativeStackScreenProps<ParamListSend, "SendNav">;

export function SendNavScreen({ route }: Props) {
  const { sendNote } = route.params || {};

  const nav = useNav();
  const goHome = useExitToHome();
  const goBack = nav.canGoBack() ? nav.goBack : goHome;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={ss.container.screen}>
        <ScreenHeader title="Send" onBack={goBack} />
        <Spacer h={8} />
        <SendNav {...{ sendNote }} />
      </View>
    </TouchableWithoutFeedback>
  );
}

type SendTab = "SEARCH" | "SEND LINK";

function SendNav({ sendNote }: { sendNote?: boolean }) {
  // Navigation
  const [tab, setTab] = useState<SendTab>(sendNote ? "SEND LINK" : "SEARCH");
  const [tabs] = useState(["SEARCH", "SEND LINK"] as SendTab[]);

  // Hack: listen for prop changed due to navigation
  const refSend = useRef(!!sendNote);
  useEffect(() => {
    if (!!sendNote !== refSend.current) {
      setTab(sendNote ? "SEND LINK" : "SEARCH");
    }
    refSend.current = !!sendNote;
  }, [sendNote]);

  return (
    <View style={{ flex: 1, flexDirection: "column" }}>
      <SegmentSlider {...{ tabs, tab, setTab }} />
      <Spacer h={24} />
      {tab === "SEARCH" && <SearchTab />}
      {tab === "SEND LINK" && <SendNoteScreen />}
    </View>
  );
}
