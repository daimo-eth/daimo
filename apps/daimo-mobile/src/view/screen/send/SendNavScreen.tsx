import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useRef, useState } from "react";
import { Keyboard, TouchableWithoutFeedback, View } from "react-native";

import { SearchTab } from "./SearchTab";
import { SendNoteScreen } from "./SendNoteScreen";
import { ScreenHeader, useExitToHome } from "../../shared/ScreenHeader";
import Spacer from "../../shared/Spacer";
import { ParamListSend, useNav } from "../../shared/nav";
import { color, ss } from "../../shared/style";

type Props = NativeStackScreenProps<ParamListSend, "SendNav">;

export function SendNavScreen({ route }: Props) {
  const { sendNote } = route.params || {};

  const nav = useNav();
  const goHome = useExitToHome();
  const goBack = nav.canGoBack() ? nav.goBack : goHome;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={ss.container.screen}>
        <ScreenHeader title="Send funds to" onBack={goBack} />
        <Spacer h={8} />
        <SendNav {...{ sendNote }} />
      </View>
    </TouchableWithoutFeedback>
  );
}

type SendTab = "Search" | "Send Link" | "Scan";

// TODO: remove after upgrading react/expo to fix typescript error
const SegmentedControlFixed = SegmentedControl as any;

function SendNav({ sendNote }: { sendNote?: boolean }) {
  // Navigation
  const [tab, setTab] = useState<SendTab>(sendNote ? "Send Link" : "Search");
  const [tabs] = useState(["Search", "Send Link"] as SendTab[]);

  // Hack: listen for prop changed due to navigation
  const refSend = useRef(!!sendNote);
  useEffect(() => {
    if (!!sendNote !== refSend.current) {
      setTab(sendNote ? "Send Link" : "Search");
    }
    refSend.current = !!sendNote;
  }, [sendNote]);

  return (
    <View style={{ flex: 1, flexDirection: "column" }}>
      <SegmentedControlFixed
        values={tabs}
        selectedIndex={tabs.indexOf(tab)}
        onValueChange={setTab}
        fontStyle={{ ...ss.text.body, color: color.grayDark }}
        activeFontStyle={ss.text.body}
        style={{ height: 48, backgroundColor: color.ivoryDark }}
      />
      <Spacer h={24} />
      {tab === "Search" && <SearchTab />}
      {tab === "Send Link" && <SendNoteScreen />}
    </View>
  );
}
